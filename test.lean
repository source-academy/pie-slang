import Lean
open Lean Elab Command

inductive myType
| constructor : myType


inductive zeroOrder
| atom (t : myType) : zeroOrder
| not (p : zeroOrder) : zeroOrder
| and (p q : zeroOrder) : zeroOrder
| or (p q : zeroOrder) : zeroOrder

def is_zeroOrder (x : zeroOrder) : Bool :=
  match x with
  | zeroOrder.atom _ => true
  | zeroOrder.not _ => true
  | zeroOrder.and _ _ => true
  | zeroOrder.or _ _ => true


def parse_zeroOrder (s : String) : Option zeroOrder :=
  match s with
  | "a" => some (zeroOrder.atom myType.constructor)
  | "b" => some (zeroOrder.atom myType.constructor)
  | "(\\lnot a)" => some (zeroOrder.not (zeroOrder.atom myType.constructor))
  | "(a \\lor b)" => some (zeroOrder.or (zeroOrder.atom myType.constructor) (zeroOrder.atom myType.constructor))
  | "(a \\land b)" => some (zeroOrder.and (zeroOrder.atom myType.constructor) (zeroOrder.atom myType.constructor))
  | _ => none

def myType0 : myType := myType.constructor

def test1 : zeroOrder := zeroOrder.atom myType0
def test2 : zeroOrder := zeroOrder.and (zeroOrder.atom myType0) (zeroOrder.or (zeroOrder.atom myType0) (zeroOrder.atom myType0))

#eval is_zeroOrder test1
#eval is_zeroOrder test2

def zeroOrderToString : zeroOrder → String
| (zeroOrder.atom _)   => "atom"
| (zeroOrder.not p)    => "(¬" ++ zeroOrderToString p ++ ")"
| (zeroOrder.and p q)  => "(" ++ zeroOrderToString p ++ " ∧ " ++ zeroOrderToString q ++ ")"
| (zeroOrder.or p q)   => "(" ++ zeroOrderToString p ++ " ∨ " ++ zeroOrderToString q ++ ")"

def optionZeroOrderToString : Option zeroOrder → String
| none           => "none"
| some zeroOrder => zeroOrderToString zeroOrder

def test_parse_and_check (s : String) : String :=
  match parse_zeroOrder s with
  | some z => if is_zeroOrder z then "valid zeroOrder" else "invalid zeroOrder"
  | none   => "failed to parse"

#eval optionZeroOrderToString (parse_zeroOrder "a \\lor b")

#eval test_parse_and_check "(a \\lor c)"

#eval test_parse_and_check "(\\lnot a)"
