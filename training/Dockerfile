FROM nvidia/cuda:12.4.1-cudnn-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV CONDA_DIR=/opt/conda
ENV PATH=/opt/conda/bin:$PATH
ENV HF_HOME=/app/hf_cache
ENV TRANSFORMERS_CACHE=/app/hf_cache
ENV PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    bzip2 \
    ca-certificates \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN wget -qO /tmp/miniconda.sh https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh && \
    bash /tmp/miniconda.sh -b -p "$CONDA_DIR" && \
    rm /tmp/miniconda.sh && \
    conda config --set always_yes yes --set changeps1 no && \
    conda update -n base -c defaults conda

RUN conda create -n pie-train python=3.11 pytorch=2.5.1 pytorch-cuda=12.4 torchvision -c pytorch -c nvidia

WORKDIR /app

COPY requirements.txt /app/requirements.txt

SHELL ["conda", "run", "-n", "pie-train", "/bin/bash", "-c"]

RUN pip install -r /app/requirements.txt && \
    pip install fastapi uvicorn huggingface_hub

COPY evaluate_offline.py /app/evaluate_offline.py
COPY serve.py /app/serve.py
COPY test-even-or-odd-holdout.jsonl /app/test-even-or-odd-holdout.jsonl
COPY test-proofs-even-odd.jsonl /app/test-proofs-even-odd.jsonl
COPY test-proofs.jsonl /app/test-proofs.jsonl
COPY output/adapter /app/adapter

RUN python -c "from huggingface_hub import snapshot_download; snapshot_download('unsloth/qwen2.5-coder-7b-instruct-bnb-4bit', cache_dir='/app/hf_cache')"

EXPOSE 8000

CMD ["python", "/app/evaluate_offline.py", "--adapter", "/app/adapter", "--test-proofs", "/app/test-proofs.jsonl"]
