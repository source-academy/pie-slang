"""
LoRA fine-tuning script for the Pie tactic proof assistant.

Trains a QLoRA adapter on top of Qwen2.5-Coder-7B-Instruct using
the cleaned single-turn training data.

Prerequisites:
    pip install unsloth datasets trl

Usage:
    python training/train.py                        # defaults
    python training/train.py --epochs 3 --lr 1e-4   # override
"""

import argparse
import json
import os
from pathlib import Path

# ── Unsloth must be imported before transformers ──────────────────────────
from unsloth import FastLanguageModel
from datasets import Dataset
from trl import SFTTrainer, SFTConfig


# ─── Config ───────────────────────────────────────────────────────────────

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DATA = PROJECT_ROOT / "training" / "training-data-lora-single.jsonl"
DEFAULT_OUT = PROJECT_ROOT / "training" / "output"

MODEL_NAME = "Qwen/Qwen2.5-Coder-7B-Instruct"
MAX_SEQ_LENGTH = 1024


def parse_args():
    p = argparse.ArgumentParser(description="LoRA fine-tune for Pie tactic assistant")
    p.add_argument("--data", type=str, default=str(DEFAULT_DATA),
                   help="Path to single-turn LoRA JSONL")
    p.add_argument("--output", type=str, default=str(DEFAULT_OUT),
                   help="Output directory for adapter & checkpoints")
    p.add_argument("--model", type=str, default=MODEL_NAME,
                   help="Base model name/path")
    p.add_argument("--epochs", type=int, default=5)
    p.add_argument("--lr", type=float, default=2e-4)
    p.add_argument("--batch", type=int, default=4,
                   help="Per-device batch size")
    p.add_argument("--grad-accum", type=int, default=4,
                   help="Gradient accumulation steps (effective batch = batch * grad_accum)")
    p.add_argument("--lora-r", type=int, default=32)
    p.add_argument("--lora-alpha", type=int, default=64)
    p.add_argument("--eval-split", type=float, default=0.1,
                   help="Fraction of data for evaluation")
    p.add_argument("--seed", type=int, default=42)
    return p.parse_args()


# ─── Data loading ─────────────────────────────────────────────────────────

def load_data(path: str, eval_split: float, seed: int):
    """Load JSONL chat data and split into train/eval."""
    records = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            records.append(json.loads(line))

    ds = Dataset.from_list(records)
    split = ds.train_test_split(test_size=eval_split, seed=seed)
    print(f"Train: {len(split['train'])}  Eval: {len(split['test'])}")
    return split["train"], split["test"]


def format_chat(example, tokenizer):
    """Apply the model's chat template to a messages list."""
    text = tokenizer.apply_chat_template(
        example["messages"],
        tokenize=False,
        add_generation_prompt=False,
    )
    return {"text": text}


# ─── Main ─────────────────────────────────────────────────────────────────

def main():
    args = parse_args()
    os.makedirs(args.output, exist_ok=True)

    # ── Load model with QLoRA ─────────────────────────────────────────────
    print(f"\nLoading {args.model} with 4-bit quantization …")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=args.model,
        max_seq_length=MAX_SEQ_LENGTH,
        dtype=None,  # auto-detect (bf16 on RTX 4080)
        load_in_4bit=True,
    )

    # ── Attach LoRA adapters ──────────────────────────────────────────────
    model = FastLanguageModel.get_peft_model(
        model,
        r=args.lora_r,
        lora_alpha=args.lora_alpha,
        lora_dropout=0.05,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        bias="none",
        use_gradient_checkpointing="unsloth",  # 60% less VRAM
        random_state=args.seed,
    )

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"Trainable params: {trainable:,} / {total:,} ({trainable/total:.2%})")

    # ── Load & format data ────────────────────────────────────────────────
    train_ds, eval_ds = load_data(args.data, args.eval_split, args.seed)

    train_ds = train_ds.map(lambda ex: format_chat(ex, tokenizer), remove_columns=["messages"])
    eval_ds = eval_ds.map(lambda ex: format_chat(ex, tokenizer), remove_columns=["messages"])

    # ── Training config ───────────────────────────────────────────────────
    effective_batch = args.batch * args.grad_accum
    steps_per_epoch = len(train_ds) // effective_batch
    total_steps = steps_per_epoch * args.epochs
    print(f"\nEffective batch: {effective_batch}, steps/epoch: {steps_per_epoch}, total: {total_steps}")

    training_args = SFTConfig(
        output_dir=args.output,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch,
        per_device_eval_batch_size=args.batch,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        lr_scheduler_type="cosine",
        warmup_ratio=0.05,
        weight_decay=0.01,
        max_grad_norm=1.0,
        bf16=True,
        max_seq_length=MAX_SEQ_LENGTH,
        dataset_text_field="text",
        packing=True,  # pack short examples into single sequences
        # Eval & checkpointing
        eval_strategy="steps",
        eval_steps=max(50, steps_per_epoch // 2),
        save_steps=max(50, steps_per_epoch // 2),
        save_total_limit=3,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        # Logging
        logging_steps=10,
        report_to="none",
        seed=args.seed,
    )

    # ── Train ─────────────────────────────────────────────────────────────
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=train_ds,
        eval_dataset=eval_ds,
        args=training_args,
    )

    print("\n── Starting training ──\n")
    trainer.train()

    # ── Save adapter ──────────────────────────────────────────────────────
    adapter_path = os.path.join(args.output, "adapter")
    model.save_pretrained(adapter_path)
    tokenizer.save_pretrained(adapter_path)
    print(f"\nAdapter saved to {adapter_path}")

    # ── Also save merged GGUF for local inference (optional) ──────────────
    try:
        gguf_path = os.path.join(args.output, "gguf")
        model.save_pretrained_gguf(
            gguf_path, tokenizer,
            quantization_method="q4_k_m",
        )
        print(f"GGUF (Q4_K_M) saved to {gguf_path}")
    except Exception as e:
        print(f"GGUF export skipped: {e}")

    print("\n── Training complete ──")


if __name__ == "__main__":
    main()
