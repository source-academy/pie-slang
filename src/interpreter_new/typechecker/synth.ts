import * as Core from "../types/core";
import * as Source from "../types/source";
import { go, Perhaps, stop, Message, freshBinder, PerhapsM, goOn, TypedBinder, fresh, FirstOrderClosure, HigherOrderClosure, isVarName } from '../types/utils';
import { Binder, bindFree, Context, Define, varType } from '../types/contexts';
import { convert, makeApp, PieInfoHook, Renaming, sameType } from "./utils";
import * as Value from "../types/value";
import { notForInfo } from "../locations";
import { Universe } from '../types/value';
import { doApp, indVecStepType } from "../normalize/evaluator";
import * as Neutral from "../types/neutral";
import { readBack, now } from '../normalize/utils';


export class Synth {
  
  public static synthNat(C: Context, r: Renaming, e: Source.Nat): Perhaps<Core.The> {
    return new go(new Core.The(
      new Core.Universe(),
      new Core.Nat()
    ));
  }

  public static synthUniverse(C: Context, r: Renaming, e: Source.Universe): Perhaps<Core.The> {
    return new stop(e.location,
      new Message(["U is a type, but it does not have a type."])
    );
  }

  public static synthArrow(context: Context, r: Renaming, e: Source.Arrow): Perhaps<Core.The> {
    const [A, B, arr] = [e.arg1, e.arg2, e.args];
    if (arr.length === 0) {
      const z = freshBinder(context, B, String('x'));
      const Aout = new PerhapsM<Core.Core>("Aout");
      const Bout = new PerhapsM<Core.Core>('Bout');
      return goOn(
        [[Aout, () => A.check(context, r, new Value.Universe())],
        [Bout, () => B.check(bindFree(context, z, context.valInContext(Aout.value)),
          r,  new Value.Universe())],],
        (() => {
          return new go<Core.The>(
            new Core.The( 
              new Core.Universe(), 
              new Core.Pi(
                z,
                Aout.value,
                Bout.value
              )))
        })
      );
    } else {
      const [C, ...rest] = arr;
      const z = freshBinder(context, makeApp(B, C, rest), 'x');
      const Aout = new PerhapsM<Core.Core>("Aout");
      const tout = new PerhapsM<Core.Core>('tout');
      return goOn(
        [
          [Aout, () => A.check(context, r, new Value.Universe())],
          [tout, () => 
            (new Source.Arrow(notForInfo(e.location), B, C, rest))
              .check(
                bindFree(context, z, context.valInContext(Aout.value)),
                r,
                new Value.Universe()
          )
          ]
        ],
        (() => {
          return new go<Core.The>(
            new Core.The(
              new Core.Universe(),
              new Core.Pi(
                z,
                Aout.value,
                tout.value
              )
            )
          )
        }))
    }
  }

  public static synthPi(context: Context, r: Renaming, e: Source.Pi): Perhaps<Core.The> {
    const [arr, B] = [e.binders, e.body];
    if (arr.length === 1) {
      const [bd, A] = [arr[0].binder, arr[0].type];
      const xhat = fresh(context, bd.varName);
      const xloc = bd.location;
      const Aout = new PerhapsM<Core.Core>('Aout');
      const Bout = new PerhapsM<Core.Core>('Bout');
      return goOn(
        [
          [Aout, () => A.check(context, r, new Value.Universe())],
          [Bout, () => B.check(
            bindFree(context, xhat, context.valInContext(Aout.value)),
            r.extendRenaming(bd.varName, xhat), 
            new Value.Universe())],
        ],
        (() => {
          PieInfoHook(xloc, ['binding-site', Aout.value!]);
          return new go<Core.The>(
            new Core.The(
              new Core.Universe(),
              new Core.Pi(
                xhat,
                Aout.value,
                Bout.value
              )
            )
          )
        })
      )
    } else if (arr.length > 1) {
      const [fst, snd, ...rest] = arr;
      const [bd, A] = [fst.binder, fst.type];
      const [y, A1] = [snd.binder, snd.type];
      const xloc = bd.location;
      const x = bd.varName;
      const xhat = fresh(context, x);
      const Aout = new PerhapsM<Core.Core>('Aout');
      const Bout = new PerhapsM<Core.Core>('Bout');
      return goOn(
        [
          [Aout, () => A.check(context, r, new Value.Universe())],
          [Bout, () => 
            (new Source.Pi(notForInfo(e.location), [snd, ...rest], B))
              .check(
                bindFree(context, xhat, context.valInContext(Aout.value)),
                r.extendRenaming(x, xhat),
                new Value.Universe()
              )
          ],
        ],
        (() => {
          PieInfoHook(xloc, ['binding-site', Aout.value!]);
          return new go<Core.The>(
            new Core.The(
              new Core.Universe(),
              new Core.Pi(
                xhat,
                Aout.value,
                Bout.value
              )
            )
          )
        })
      )
    } else {
      throw new Error('Invalid number of binders in Pi type');
    }
  }

  public static synthZero(context: Context, r: Renaming, e: Source.Zero): Perhaps<Core.The> {
    return new Source.The(
      e.location, 
      new Source.Nat(e.location),
      new Source.Zero(e.location)
      )
  }


  public static synthAdd1(context: Context, r: Renaming, e: Source.Add1): Perhaps<Core.The> {
    const nout = new PerhapsM<Core.Core>('nout');
    return goOn(
      [[nout, () => e.check(context, r, new Value.Nat())]],
      () => new go<Core.The>(
        new Core.The(
          new Core.Nat(),
          new Core.Add1(nout.value)
        )
      )
    );
  }

  public static synthWhichNat(context: Context, r: Renaming, e: Source.WhichNat): Perhaps<Core.The> {
    const tgtout = new PerhapsM<Core.Core>('tgtout');
    const b_rst = new PerhapsM<Core.The>('b_rst');
    const sout = new PerhapsM<Core.Core>('sout');
    return goOn(
      [
        [tgtout, () => e.target.check(context, r, new Value.Nat())],
        [b_rst, () => e.base.synth(context, r)],
        [sout, () => e.step.check(
          context,
          r,
          (() => {
            const n_minus_1 = fresh(context, 'n_minus_1');
            return new Value.Pi(
              n_minus_1,
              new Value.Nat(),
              new FirstOrderClosure(
                context.contextToEnvironment(),
                n_minus_1,
                b_rst.value.type
              )
            )
          }) ()
        )],
      ],
      () => new go<Core.The>(
        new Core.The(
          b_rst.value,
          new Core.WhichNat(
            tgtout.value,
            new Core.The(
              b_rst.value.type,
              b_rst.value.expr),
            sout.value
          )
        )
      )
    );
  }



  public static synthIterNat(context: Context, r: Renaming, e: Source.IterNat): Perhaps<Core.The> {
    const tgtout = new PerhapsM<Core.Core>('tgtout');
    const b_rst = new PerhapsM<Core.The>('b_rst');
    const sout = new PerhapsM<Core.Core>('sout');
    return goOn(
      [
        [tgtout, () => e.target.check(context, r, new Value.Nat())],
        [b_rst, () => e.base.synth(context, r)],
        [sout, () => e.step.check(
          context,
          r,
          (() => {
            const old = fresh(context, 'old');
            return context.valInContext(
              new Core.Pi(
                old,
                b_rst.value.type,
                b_rst.value.type
              ))
          })()
        )],
      ],
      () => new go<Core.The>(
        new Core.The(
          b_rst.value.type,
          new Core.IterNat(
            tgtout.value,
            new Core.The(
              b_rst.value.type,
              b_rst.value.expr
            ),
            sout.value
          )
        )
      )
    );
  }



  public static synthRecNat(context: Context, r: Renaming, e: Source.RecNat): Perhaps<Core.The> {
    const tgtout = new PerhapsM<Core.Core>('tgtout');
    const b_rst = new PerhapsM<Core.The>('b_rst');
    const sout = new PerhapsM<Core.Core>('sout');
    return goOn(
      [
        [tgtout, () => e.target.check(context, r, new Value.Nat())],
        [b_rst, () => e.base.synth(context, r)],
        [sout, () => e.step.check(
          context,
          r,
          (() => {
            const n_minus_1 = fresh(context, 'n_minus_1');
            const old = fresh(context, 'old');
            return context.valInContext(
              new Core.Pi(
                n_minus_1,
                new Core.Nat(),
                new Core.Pi(
                  old,
                  b_rst.value.type,
                  b_rst.value.type
                )
              )
            )
          })()
        )],
      ],
      () => new go<Core.The>(
        new Core.The(
          b_rst.value.type,
          new Core.RecNat(
            tgtout.value,
            new Core.The(
              b_rst.value.type,
              b_rst.value.expr
            ),
            sout.value
          )
        )
      )
    );
  }


  public static synthIndNat(context: Context, r: Renaming, e: Source.IndNat): Perhaps<Core.The> {
    const tgtout = new PerhapsM<Core.Core>('tgtout');
    const motout = new PerhapsM<Core.Core>('motout');
    const motval = new PerhapsM<Value.Value>('motval');
    const bout = new PerhapsM<Core.Core>('bout');
    const sout = new PerhapsM<Core.Core>('sout');
    return goOn(
      [
        [tgtout, () => e.target.check(context, r, new Value.Nat())],
        [motout, () => e.motive.check(context, r, new Value.Pi(
          'n',
          new Value.Nat(),
          new HigherOrderClosure((n) => new Value.Universe())
        ))],
        [motval, () => new go(
          context.valInContext(motout.value)
        )],
        [bout, () => e.base.check(
          context,
          r,
          doApp(motval.value, new Value.Zero())
        )],
        [sout, () => new Value.Pi(
          'n_minus_1',
          new Value.Nat(),
          new HigherOrderClosure(
            (n_minus_1: Value.Nat) => (new Value.Pi(
            'ih',
            doApp(motval.value, new Value.Nat),
            new HigherOrderClosure(
              (_) => doApp(motval.value, new Value.Add1(n_minus_1))
            )

          )))
        )],
      ],
      () => new go<Core.The>(
        new Core.The(
          new Core.Application(
            motout.value,
            tgtout.value
          ),
          new Core.IndNat(
            tgtout.value,
            motout.value,
            bout.value,
            sout.value
          )
        )
      )
    );
  }

  public static synthAtom(context: Context, r: Renaming, e: Source.Atom): Perhaps<Core.The> {
    return new go(
      new Core.The(
        new Core.Universe(),
        new Core.Atom()
      )
    )
  }


  public static synthPair(context: Context, r: Renaming, e: Source.Pair): Perhaps<Core.The> {
    const [A, D] = [e.first, e.second];
    const a = fresh(context, 'a');
    const Aout = new PerhapsM<Core.Core>('Aout');
    const Dout = new PerhapsM<Core.Core>('Dout');
    return goOn(
      [
        [Aout, () => A.check(context, r, new Value.Universe())],
        [Dout, () => D.check(
          bindFree(context, a, context.valInContext(Aout.value)),
          r,
          new Value.Universe()
        )],
      ],
      () => new go<Core.The>(
        new Core.The(
          new Core.Universe(),
          new Core.Sigma(
            a,
            Aout.value,
            Dout.value
          )
        )
      )
    );
  }


  public static synthSigma(context: Context, r: Renaming, e: Source.Sigma): Perhaps<Core.The> {
    const [arr, D] = [e.binders, e.body];
    if (arr.length === 1) {
      const [bd, A] = [arr[0].binder, arr[0].type];
      const xhat = fresh(context, bd.varName);
      const xloc = bd.location;
      const Aout = new PerhapsM<Core.Core>('Aout');
      const Dout = new PerhapsM<Core.Core>('Dout');
      return goOn(
        [
          [Aout, () => A.check(context, r, new Value.Universe())],
          [Dout, () => D.check(
            bindFree(context, xhat, context.valInContext(Aout.value)),
            r.extendRenaming(bd.varName, xhat),
            new Value.Universe()
          )],
        ],
        () => {
          PieInfoHook(xloc, ['binding-site', Aout.value!]);
          return new go<Core.The>(
            new Core.The(
              new Core.Universe(),
              new Core.Sigma(
                xhat,
                Aout.value,
                Dout.value
              )
            )
          )
        }
      )
    } else if (arr.length > 1) {
      const [[bd, A], yA1, ...rest] 
        = [[arr[0].binder, arr[0].type], arr[1], ...arr.slice(2)];
      const xloc = bd.location;
      const x = bd.varName;
      const xhat = fresh(context, x);
      const Aout = new PerhapsM<Core.Core>('Aout');
      const Dout = new PerhapsM<Core.Core>('Dout');
      return goOn(
        [
          [Aout, () => A.check(context, r, new Value.Universe())],
          [Dout, () => (new Source.Sigma(
            notForInfo(e.location),
            [yA1, ...rest],
            D
          )).check(
            bindFree(context, xhat, context.valInContext(Aout.value)),
            r.extendRenaming(x, xhat),
            new Value.Universe()
          )],
        ],
        () => {
          PieInfoHook(xloc, ['binding-site', Aout.value!]);
          return new go<Core.The>(
            new Core.The(
              new Core.Universe(),
              new Core.Sigma(
                xhat,
                Aout.value,
                Dout.value
              )
            )
          )
        }
      )
    } else {
      throw new Error('Invalid number of binders in Sigma type');
    }
  }

  public static synthCar(context: Context, r: Renaming, e: Source.Car): Perhaps<Core.The> {
    const p_rst = new PerhapsM<Core.The>('p_rst');
    return goOn(
      [[p_rst, () => e.pair.synth(context, r)]],
      () => {
        const val = context.valInContext(p_rst.value);
        if (val instanceof Value.Sigma) {
          const [x, A, clos] = [val.carName, val.carType, val.cdrType];
          return new go(
            new Core.The(
              A.readBackType(context),
              new Core.Car(
                p_rst.value.expr,
              )
            )
          )
        } else {
          return new stop(
            e.location,
            new Message([`car requires a Pair type, but was used as a: ${val}.`])
          );
        }
      }
    )
  }

  public static synthCdr(context: Context, r: Renaming, e: Source.Cdr): Perhaps<Core.The> {
    const p_rst = new PerhapsM<Core.The>('p_rst');
    return goOn(
      [[p_rst, () => e.pair.synth(context, r)]],
      () => {
        const val = context.valInContext(p_rst.value.type);
        if (val instanceof Value.Sigma) {
          const [x, A, clos] = [val.carName, val.carType, val.cdrType];
          return new go(
            new Core.The(
              clos.valOfClosure(new Value.Neutral(A, new Neutral.Variable(x)))
                  .readBackType(context),
              new Core.Cdr(
                p_rst.value.expr,
              )
            )
          );
        } else {
          return new stop(
            e.location,
            new Message([`cdr requires a Pair type, but was used as a: ${val}.`])
          );
        }
      }
    )
  }

//TODO: Quote Trivial Sole


  public static synthIndList(context: Context, r: Renaming, e: Source.IndList): Perhaps<Core.The> {
    const themeta = new PerhapsM<Core.The>('themeta');
    const motout = new PerhapsM<Core.Core>('motout');
    const motval = new PerhapsM<Value.Value>('motval');
    const bout = new PerhapsM<Core.Core>('bout');
    const sout = new PerhapsM<Core.Core>('sout');
    return goOn(
      [
        [themeta, () => e.target.synth(context, r)],
      ],
      (() => {
        const mtc = context.valInContext(themeta.value);
        if (mtc instanceof Value.List) {
          const E = mtc.entryType;
          return goOn(
            [
              [motout, () => e.motive.check(
                context,
                r,
                new Value.Pi(
                  'xs',
                  new Value.List(E),
                  new FirstOrderClosure(
                    context.contextToEnvironment(),
                    'xs',
                    new Core.Universe()
                  )
                )
              )],
              [motval, () => new go(context.valInContext(motout.value))],
              [bout, () => e.base.check(
                context,
                r,
                doApp(motval.value, new Value.Nil())
              )],
              [sout, () => e.step.check(
                context,
                r,
                new Value.Pi(
                  'e',
                  E,
                  new HigherOrderClosure(
                    (e: Value.Value) => new Value.Pi(
                      'es',
                      new Value.List(E),
                      new HigherOrderClosure(
                        (es: Value.Value) => new Value.Pi(
                          'ih',
                          doApp(motval.value, es),
                          new HigherOrderClosure(
                            (_) => doApp(motval.value, new Value.Cons(e, es))
                          )
                        )
                      )
                    )
                  )
                )
              )],
            ],
            () => new go<Core.The>(
              new Core.The(
                new Core.Application(
                  motout.value,
                  themeta.value
                ),
                new Core.IndList(
                  themeta.value.expr,
                  motout.value,
                  bout.value,
                  sout.value
                )
              )
            )
          );
        } else {
          return new stop(
            e.location,
            new Message([`Not a List: ${mtc.readBackType(context)}.`])
          );
        }
      })
    )
  }


  public static synthRecList(context: Context, r: Renaming, e: Source.RecList): Perhaps<Core.The> {
    const themeta = new PerhapsM<Core.The>('themeta');
    return goOn(
      [[themeta, () => e.target.synth(context, r)]],
      () => {
        const [tgtt, tgtout] = [themeta.value.type, themeta.value.expr];
        const mtc = context.valInContext(tgtt);
        if (mtc instanceof Value.List) {
          const E = mtc.entryType;
          const themeta_2 = new PerhapsM<Core.The>('themeta_2');
          const btval = new PerhapsM<Value.Value>('btval');
          const sout = new PerhapsM<Core.Core>('sout');
          return goOn(
            [
              [themeta_2, () => e.base.synth(context, r)],
              [btval, () => new go(context.valInContext(themeta_2.value.type))],
              [sout, () => e.step.check(
                context,
                r,
                new Value.Pi(
                  'e',
                  E,
                  new HigherOrderClosure(
                    (e: Value.Value) => new Value.Pi(
                      'es',
                      new Value.List(E),
                      new HigherOrderClosure(
                        (es: Value.Value) => new Value.Pi(
                          'ih',
                          btval.value,
                          new HigherOrderClosure(
                            (_) => btval.value
                          )
                        )
                      )
                    )
                  )
                )
              )],
            ],
            () => new go<Core.The>(
              new Core.The(
                themeta_2.value.type,
                new Core.RecList(
                  tgtout,
                  new Core.The(
                    themeta_2.value.type,
                    themeta_2.value.expr
                  ),
                  sout.value
                )
              )
            )
          );
        } else {
          return new stop(
            e.location,
            new Message([`Not a List: ${mtc.readBackType(context)}.`])
          );
        }
      }
    )
  }


  public static synthList(context: Context, r: Renaming, e: Source.List): Perhaps<Core.The> {
    const Eout = new PerhapsM<Core.Core>('Eout');
    return goOn(
      [[Eout, () => e.entryType.check(context, r, new Value.Universe())]],
      () => new go<Core.The>(
        new Core.The(
          new Core.Universe(),
          new Core.List(Eout.value)
        )
      )
    );
  }


  public static synthConsList(context: Context, r: Renaming, e: Source.ConsList): Perhaps<Core.The> {
    const [x, xs] = [e.x, e.xs];
    const e_rst = new PerhapsM<Core.The>('e_rst');
    const esout = new PerhapsM<Core.Core>('esout');
    return goOn(
      [
        [e_rst, () => x.synth(context, r)],
        [esout, () => xs.check(
          context,
          r,
          context.valInContext(new Core.List(e_rst.value.type))
        )],
      ],
      () => new go<Core.The>(
        new Core.The(
          new Core.List(e_rst.value.type),
          new Core.ListCons(
            e_rst.value,
            esout.value
          )
        )
      )
    );
  }


  public static synthAbsurd(context: Context, r: Renaming, e: Source.Absurd): Perhaps<Core.The> {
    return new go(
      new Core.The(
        new Core.Universe(),
        new Core.Absurd()
      )
    );
  }


  
  public static synthIndAbsurd(context: Context, r: Renaming, e: Source.IndAbsurd): Perhaps<Core.The> {
    const tgtout = new PerhapsM<Core.Core>('tgtout');
    const motout = new PerhapsM<Core.Core>('motout');
    return goOn(
      [
        [tgtout, () => e.target.check(context, r, new Value.Absurd())],
        [motout, () => e.motive.check(context, r, new Value.Universe())],
      ],
      () => new go<Core.The>(
        new Core.The(
          motout.value,
          new Core.IndAbsurd(
            tgtout.value,
            motout.value
          )
        )
      )
    );
  }


  
  public static synthEqual(context: Context, r: Renaming, e: Source.Equal): Perhaps<Core.The> {
    const [A, from, to] = [e.type, e.left, e.right];
    const Aout = new PerhapsM<Core.Core>('Aout');
    const Av = new PerhapsM<Value.Value>('Av');
    const from_out = new PerhapsM<Core.Core>('from_out');
    const to_out = new PerhapsM<Core.Core>('to_out');
    return goOn(
      [
        [Aout, () => A.check(context, r, new Value.Universe())],
        [Av, () => new go(context.valInContext(Aout.value))],
        [from_out, () => from.check(context, r, Av.value)],
        [to_out, () => to.check(context, r, Av.value)],
      ],
      () => new go<Core.The>(
        new Core.The(
          new Core.Universe(),
          new Core.Equal(
            Aout.value,
            from_out.value,
            to_out.value
          )
        )
      )
    );
  }      


  public static synthReplace(context: Context, r: Renaming, e: Source.Replace): Perhaps<Core.The> {
    const [tgt, mot, b] = [e.target, e.motive, e.base];
    const tgt_rst = new PerhapsM<Core.The>('tgt_rst');
    const motout = new PerhapsM<Core.Core>('motout');
    const bout = new PerhapsM<Core.Core>('bout');
    return goOn(
      [[tgt_rst, () => tgt.synth(context, r)]],
      () => {
        const result = context.valInContext(tgt_rst.value);
        if (result instanceof Value.Equal) {
          const [Av, fromv, tov] = [result.type, result.from, result.to];
          return goOn(
            [
              [motout, () => mot.check(
                context,
                r,
                new Value.Pi(
                  'x',
                  Av,
                  new HigherOrderClosure(
                    (_) => new Value.Universe()
                  )
                )
              )],
              [bout, () => b.check(
                context,
                r,
                doApp(context.valInContext(motout.value), fromv)
              )],
            ],
            () => new go(
              new Core.The(
                (doApp(context.valInContext(motout.value), tov)).readBackType(context),
                new Core.Replace(
                  tgt_rst.value.expr,
                  motout.value,
                  bout.value
                )
              )
            )
          );
        } else {
          return new stop(
            e.location,
            new Message([`Expected an expression with = type, but the type was: ${tgt_rst.value.expr}.`])
          );
        }
      }
    );
  }

  public static synthTrans(context: Context, r: Renaming, e: Source.Trans): Perhaps<Core.The> {
    const [p1, p2] = [e.left, e.right];
    const p1_rst = new PerhapsM<Core.The>('p1_rst');
    const p2_rst = new PerhapsM<Core.The>('p2_rst');
    return goOn(
      [
        [p1_rst, () => p1.synth(context, r)],
        [p2_rst, () => p2.synth(context, r)],
      ],
      () => {
        const result1 = context.valInContext(p1_rst.value.type);
        const result2 = context.valInContext(p2_rst.value.type);
        if (result1 instanceof Value.Equal && result2 instanceof Value.Equal) {
          const [Av, fromv, midv] = [result1.type, result1.from, result1.to];
          const [Bv, midv2, tov] = [result2.type, result2.from, result2.to];
          const ph1 = new PerhapsM<any>('ph1');
          const ph2 = new PerhapsM<any>('ph2');
          return goOn(
            [
              [ph1, () => sameType(context, e.location, Av, Bv)],
              [ph2, () => convert(context, e.location, Av, midv, midv2)],
            ],
            () => new go<Core.The>(
              new Core.The(
                (new Value.Equal(Av, fromv, tov)).readBackType(context),
                new Core.Trans(
                  p1_rst.value.expr,
                  p2_rst.value.expr
                )
              )
            )
          );
        } else {
          return new stop(
            e.location,
            new Message([`Expected =, got ${result1} and ${result2}.`])
          );
        }
      }
    )
  }

  public static synthCong(context: Context, r: Renaming, e: Source.Cong): Perhaps<Core.The> {
    const [p, f] = [e.from, e.to];
    const p_rst = new PerhapsM<Core.The>('p_rst');
    const f_rst = new PerhapsM<Core.The>('f_rst');
    return goOn(
      [
        [p_rst, () => p.synth(context, r)],
        [f_rst, () => f.synth(context, r)],
      ],
      () => {
        const result1 = context.valInContext(p_rst.value.type);
        const result2 = context.valInContext(f_rst.value.type);
        if (result1 instanceof Value.Equal) {
          const [Av, fromv, tov] = [result1.type, result1.from, result1.to];
          if (result2 instanceof Value.Pi) {
            const [x, Bv, c] = [result2.argName, result2.argType, result2.resultType];
            const ph = new PerhapsM<any>('ph');
            const Cv = new PerhapsM<Value.Value>('Cv');
            const fv = new PerhapsM<Value.Value>('fv');
            return goOn(
              [
                [ph, () => sameType(context, e.location, Av, Bv)],
                [Cv, () => new go(c.valOfClosure(fromv))],
                [fv, () => new go(context.valInContext(f_rst.value.expr))],
              ],
              () => new go(
                new Core.The(
                  new Core.Equal(
                    Cv.value.readBackType(context),
                    readBack(context, Cv.value, doApp(fv.value, fromv)),
                    readBack(context, Cv.value, doApp(fv.value, tov))
                  ),
                  new Core.Cong(
                    p_rst.value.expr,
                    Cv.value.readBackType(context),
                    f_rst.value.expr
                  )
                )
              )
            );
          } else {
            return new stop(
              e.location,
              new Message([`Expected a function type, got ${result2.readBackType(context)}.`])
            );
          }
        } else {
          return new stop(
            e.location,
            new Message([`Expected an = type, got ${result1.readBackType(context)}.`])
          );
        }
      }
    )
  }

  public static synthSymm(context: Context, r: Renaming, e: Source.Symm): Perhaps<Core.The> {
    const p_rst = new PerhapsM<Core.The>('p_rst');
    return goOn(
      [[p_rst, () => e.equality.synth(context, r)]],
      () => {
        const result = context.valInContext(p_rst.value.type);
        if (result instanceof Value.Equal) {
          const [Av, fromv, tov] = [result.type, result.from, result.to];
          return new go(
            new Core.The(
              (new Value.Equal(
                Av,
                tov,
                fromv
              )).readBackType(context),
              new Core.Symm(
                p_rst.value.expr
              )
            )
          );
        } else {
          return new stop(
            e.location,
            new Message([`Expected an = type, got ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }


  public static synthIndEqual(context: Context, r: Renaming, e: Source.IndEqual): Perhaps<Core.The> {
    const tgt_rst = new PerhapsM<Core.The>('tgt_rst');
    const motout = new PerhapsM<Core.Core>('motout');
    const motv = new PerhapsM<Value.Value>('motv');
    const baseout = new PerhapsM<Core.Core>('baseout');
    return goOn(
      [[tgt_rst, () => e.from.synth(context, r)]],
      () => {
        const result = context.valInContext(tgt_rst.value.type);
        if (result instanceof Value.Equal) {
          const [Av, fromv, tov] = [result.type, result.from, result.to];
          return goOn(
            [
              [motout, () => e.to.check(
                context,
                r,
                new Value.Pi(
                  'to',
                  Av,
                  new HigherOrderClosure(
                    (to: Value.Value) => new Value.Pi(
                      'p',
                      new Value.Equal(Av, fromv, to),
                      new HigherOrderClosure(
                        (_) => new Value.Universe()
                      )
                    )
                  )
                )
              )],
              [motv, () => new go(context.valInContext(motout.value))],
              [baseout, () => e.base.check(
                context,
                r,
                doApp(doApp(motv.value, fromv), new Value.Same(fromv))
              )],
            ],
            () => new go<Core.The>(
              new Core.The(
                (doApp(doApp(motv.value, tov), 
                      context.valInContext(tgt_rst.value.expr))).readBackType(context),
                new Core.IndEqual(
                  tgt_rst.value.expr,
                  motout.value,
                  baseout.value
                )
              )
            )
          );
        } else {
          return new stop(
            e.location,
            new Message([`Expected evidence of equality, got ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }



  public static synthVec(context: Context, r: Renaming, e: Source.Vec): Perhaps<Core.The> {
    const [E, len] = [e.type, e.length];
    const Eout = new PerhapsM<Core.Core>('Eout');
    const lenout = new PerhapsM<Core.Core>('lenout');
    return goOn(
      [
        [Eout, () => E.check(context, r, new Value.Universe())],
        [lenout, () => len.check(context, r, new Value.Nat())],
      ],
      () => new go<Core.The>(
        new Core.The(
          new Core.Universe(),
          new Core.Vec(Eout.value, lenout.value)
        )
      )
    );
  }



  public static synthHead(context: Context, r: Renaming, e: Source.Head): Perhaps<Core.The> {
    const es_rst = new PerhapsM<Core.The>('es_rst');
    return goOn(
      [[es_rst, () => e.vec.synth(context, r)]],
      () => {
        const result = now(context.valInContext(es_rst.value.type));
        if (result instanceof Value.Vec) {
          const [E, len] = [result.entryType, result.length];
          if (len instanceof Value.Add1) {
            return new go(
              new Core.The(
                E.readBackType(context),
                new Core.Head(
                  es_rst.value.expr
                )
              )
            );
          } else {
            return new stop(
              e.location,
              new Message([`Expected a Vec with add1 at the top of the length, got ${
                readBack(context, new Value.Nat(), len)}.`])
            );
          }
        } else {
          return new stop(
            e.location,
            new Message([`Expected a Vec, got ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }



  public static synthTail(context: Context, r: Renaming, e: Source.Tail): Perhaps<Core.The> {
    const es_rst = new PerhapsM<Core.The>('es_rst');
    return goOn(
      [[es_rst, () => e.vec.synth(context, r)]],
      () => {
        const result = now(context.valInContext(es_rst.value.type));
        if (result instanceof Value.Vec) {
          const [E, len] = [result.entryType, result.length];
          if (len instanceof Value.Add1) {
            const len_minus_1 = len.smaller;
            return new go(
              new Core.The(
                new Core.Vec(
                  E.readBackType(context), 
                  readBack(context, new Value.Nat(), len_minus_1)),
                new Core.Tail(
                  es_rst.value.expr
                )
              )
            );
          } else {
            return new stop(
              e.location,
              new Message([`Expected a Vec with add1 at the top of the length, got ${
                readBack(context, new Value.Nat(), len)}.`])
            );
          }
        } else {
          return new stop(
            e.location,
            new Message([`Expected a Vec, got ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }

  public static synthIndVec(context: Context, r: Renaming, e: Source.IndVec): Perhaps<Core.The> {
    const lenout = new PerhapsM<Core.Core>('lenout');
    const lenv = new PerhapsM<Value.Value>('lenv');
    const vecout = new PerhapsM<Core.The>('vecout');
    const motout = new PerhapsM<Core.Core>('motout');
    const motval = new PerhapsM<Value.Value>('motval');
    const bout = new PerhapsM<Core.Core>('bout');
    const sout = new PerhapsM<Core.Core>('sout');
    const any = new PerhapsM<any>('any');
    return goOn(
      [
        [lenout, () => e.length.check(context, r, new Value.Nat())],
        [lenv, () => new go(context.valInContext(lenout.value))],
        [vecout, () => e.target.synth(context, r)],
      ],
      () => {
        const result = context.valInContext(vecout.value.type);
        if (result instanceof Value.Vec) {
          const [E, len2v] = [result.entryType, result.length];
          return goOn(
            [
              [any, () => convert(context, e.location, new Value.Nat(), lenv.value, len2v)],
              [motout, () => e.motive.check(
                context,
                r,
                new Value.Pi(
                  'k',
                  new Value.Nat(),
                  new HigherOrderClosure(
                    (k: Value.Value) => new Value.Pi(
                      'es',
                      new Value.Vec(E, k),
                      new HigherOrderClosure(
                        (_) => new Value.Universe()
                      )
                    )
                  )
                )
              )],
              [motval, () => new go(context.valInContext(motout.value))],
              [bout, () => e.base.check(
                context,
                r,
                doApp(doApp(motval.value, new Value.Zero()), new Value.VecNil())
              )],
              [sout, () => e.step.check(
                context,
                r,
                indVecStepType(E, motval.value)
              )],
            ],
            () => new go<Core.The>(
              new Core.The(
                new Core.Application(
                  new Core.Application(
                    motout.value,
                    lenout.value
                  ),
                  vecout.value.expr
                ),
                new Core.IndVec(
                  lenout.value,
                  vecout.value.expr,
                  motout.value,
                  bout.value,
                  sout.value
                )
              )
            )
          );
        } else {
          return new stop(
            e.location,
            new Message([`Expected a Vec, got ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }

  public static synthEither(context: Context, r: Renaming, e: Source.Either): Perhaps<Core.The> {
    const [L, R] = [e.left, e.right];
    const Lout = new PerhapsM<Core.Core>('Lout');
    const Rout = new PerhapsM<Core.Core>('Rout');
    return goOn(
      [
        [Lout, () => L.check(context, r, new Value.Universe())],
        [Rout, () => R.check(context, r, new Value.Universe())],
      ],
      () => new go<Core.The>(
        new Core.The(
          new Core.Universe(),
          new Core.Either(Lout.value, Rout.value)
        )
      )
    );
  }


  public static synthIndEither(context: Context, r: Renaming, e: Source.IndEither): Perhaps<Core.The> {
    const tgt_rst = new PerhapsM<Core.The>('tgt_rst');
    const motout = new PerhapsM<Core.Core>('motout');
    const motval = new PerhapsM<Value.Value>('motval');
    const lout = new PerhapsM<Core.Core>('lout');
    const rout = new PerhapsM<Core.Core>('rout');
    return goOn(
      [[tgt_rst, () => e.target.synth(context, r)]],
      () => {
        const result = context.valInContext(tgt_rst.value.type);
        if (result instanceof Value.Either) {
          const [Lv, Rv] = [result.leftType, result.rightType];
          return goOn(
            [
              [motout, () => e.motive.check(
                context,
                r,
                new Value.Pi(
                  'x',
                  new Value.Either(Lv, Rv),
                  new HigherOrderClosure(
                    (_) => new Value.Universe()
                  )
                )
              )],
              [motval, () => new go(context.valInContext(motout.value))],
              [lout, () => e.baseLeft.check(
                context,
                r,
                new Value.Pi(
                  'x',
                  Lv,
                  new HigherOrderClosure(
                    (x) => doApp(motval.value, new Value.Left(x))
                  )
                )
              )],
              [rout, () => e.baseRight.check(
                context,
                r,
                new Value.Pi(
                  'x',
                  Rv,
                  new HigherOrderClosure(
                    (x) => doApp(motval.value, new Value.Right(x))
                  )
                )
              )],
            ],
            () => new go<Core.The>(
              new Core.The(
                new Core.Application(
                  motout.value,
                  tgt_rst.value.expr
                ),
                new Core.IndEither(
                  tgt_rst.value.expr,
                  motout.value,
                  lout.value,
                  rout.value
                )
              )
            )
          );
        } else {
          return new stop(
            e.location,
            new Message([`Expected an Either, but got a ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }

  public static synthThe(context: Context, r: Renaming, e: Source.The): Perhaps<Core.The> {
    const t_out = new PerhapsM<Core.Core>('t_out');
    const e_out = new PerhapsM<Core.Core>('e_out');
    return goOn(
      [
        [t_out, () => e.type.isType(context, r)],
        [e_out, () => e.value.check(context, r, context.valInContext(t_out.value))],
      ],
      () => new go<Core.The>(
        new Core.The(
          t_out.value,
          e_out.value
        )
      )
    );
  }  


//TODO: might have bugs
  public static synthApplication(context: Context, r: Renaming, e: Source.Application): Perhaps<Core.The> {
    const [rator, rand0, ...rands] = [e.func, e.arg, ...e.args];
    if (rands.length === 0) {
        const rator_out = new PerhapsM<Core.The>('rator_out');
        return goOn(
          [[rator_out, () => rator.synth(context, r)]],
          () => {
            const result = context.valInContext(rator_out.value.type);
            if (result instanceof Value.Pi) {
              const [x, A, c] = [result.argName, result.argType, result.resultType];
              const rand_out = new PerhapsM<Core.Core>('rand_out');
              return goOn(
                [[rand_out, () => rand0.check(context, r, A)]],
                () => new go(
                  new Core.The(
                    c.valOfClosure(context.valInContext(rand_out.value)).readBackType(context),
                    new Core.Application(
                      rator_out.value.expr,
                      rand_out.value
                    )
                  )
                )
              );
            } else {
              return new stop(
                e.location,
                new Message([`Not a function type: ${result.readBackType(context)}.`])
              );
            }
          }
        );
    } else {
        
          const appmeta = new PerhapsM<Core.The>('appmeta');
          return goOn(
            [[appmeta, () => (
              new Source.Application(
                notForInfo(e.location),
                rator,
                rand0,
                rands.slice(0, rands.length - 1)
              )
            ).synth(context, r)]],
            () => {
              const result = context.valInContext(appmeta.value.type);
              if (result instanceof Value.Pi) {
                const [x, A, c] = [result.argName, result.argType, result.resultType];
                const rand_out = new PerhapsM<Core.Core>('rand_out');
                return goOn(
                  [[rand_out, () => rands[rands.length - 1].check(context, r, A)]],
                  () => new go(
                    new Core.The(
                      c.valOfClosure(context.valInContext(rand_out.value)).readBackType(context),
                      new Core.Application(
                        appmeta.value.expr,
                        rand_out.value
                      )
                    )
                  )
                );
              } else {
                return new stop(
                  e.location,
                  new Message([`Not a function type: ${result.readBackType(context)}.`])
                );
              }
            }
          );
        
    }
    
  }
/*
[x
      (cond [(and (symbol? x) (var-name? x))
             (let ((real-x (rename r x)))
              (go-on ((x-tv (var-type Γ (src-loc e) real-x)))
                (begin (match (assv real-x Γ)
                         [(cons _ (def _ _))
                          (send-pie-info (src-loc e) 'definition)]
                         [_ (void)])
                       (go `(the ,(read-back-type Γ x-tv) ,real-x)))))]
            [(number? x)
             (cond [(zero? x)
                    (go `(the Nat zero))]
                   [(positive? x)
                    (go-on ((n-1-out (check Γ
                                            r
                                            (@ (src-loc e) (sub1 x))
                                            'NAT)))
                      (go `(the Nat (add1 ,n-1-out))))])]
            [else
             (stop (src-loc e)
                   `("Can't determine a type"))])]
*/

  public static synthName(context: Context, r: Renaming, e: Source.Name): Perhaps<Core.The> {
    const real_x = r.rename(e.name);
    const x_tv = new PerhapsM<Value.Value>('x_tv');
    return goOn(
      [[x_tv, () => varType(context, e.location, real_x)]],
      () => {
        const result = context.context.get(real_x);
        if (result instanceof Define) {
          PieInfoHook(e.location, 'definition');
        } 
        return new go(
          new Core.The(
            x_tv.value.readBackType(context),
            new Core.VarName(real_x)
          )
        )
      }
    );
  }

  public static synthNumber(context: Context, r: Renaming, e: Source.Number): Perhaps<Core.The> {
    if (e.value === 0) {
      return new go(
        new Core.The(
          new Core.Nat(),
          new Core.Zero()
        )
      );
    } else if (e.value > 0) {
      const n_minus_1_out = new PerhapsM<Core.Core>('n_1_out');
      return goOn(
        [[n_minus_1_out, () => (new Source.Number(e.location, e.value - 1)).check(context, r, new Value.Nat())]],
        () => new go(
          new Core.The(
            new Core.Nat(),
            new Core.Add1(n_minus_1_out.value)
          )
        )
      );
    } else {
      return new stop(
        e.location,
        new Message([`Expected a positive number, got ${e.value}.`])
      );
    }
  }
}