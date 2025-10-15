import * as C from "../types/core";
import * as S from "../types/source";
import * as V from "../types/value";

import {
  go, Perhaps, stop, Message, freshBinder, PerhapsM, goOn,
  fresh, FirstOrderClosure, HigherOrderClosure,
  TypedBinder
} from '../types/utils';
import { bindFree, Context, contextToEnvironment, Define, valInContext, varType, getInductiveType, InductiveDatatypeBinder, ConstructorTypeBinder } from '../utils/context';
import { atomOk, convert, extendRenaming, makeApp, PieInfoHook, rename, Renaming, sameType } from "./utils";
import { notForInfo } from "../utils/locations";
import { doApp, doCar, indVecStepType } from "../evaluator/evaluator";
import { readBack } from '../evaluator/utils';
import { Location } from '../utils/locations';
import { alphaEquiv } from "../utils/alphaeqv";


export class synthesizer {

  public static synthNat(ctx: Context, r: Renaming): Perhaps<C.The> {
    return new go(new C.The(
      new C.Universe(),
      new C.Nat()
    ));
  }

  public static synthUniverse(ctx: Context, r: Renaming, location: Location): Perhaps<C.The> {
    return new stop(location,
      new Message(["U is a type, but it does not have a type."])
    );
  }

  public static synthArrow(context: Context, r: Renaming, location: Location, arg1: S.Source, arg2: S.Source, args: S.Source[]): Perhaps<C.The> {
    if (args.length === 0) {
      const z = freshBinder(context, arg2, 'x');
      const Aout = new PerhapsM<C.Core>("Aout");
      const Bout = new PerhapsM<C.Core>('Bout');
      return goOn(
        [
          [Aout, () =>
            arg1.check(context, r, new V.Universe())],
          [Bout, () =>
            arg2.check(
              bindFree(context, z, valInContext(context, Aout.value)),
              r,
              new V.Universe()
            )
          ],
        ],
        (() => {
          return new go<C.The>(
            new C.The(
              new C.Universe(),
              new C.Pi(
                z,
                Aout.value,
                Bout.value
              )))
        })
      );
    } else {
      const [first, ...rest] = args;
      const z = freshBinder(context, makeApp(arg2, first, rest), 'x');
      const Aout = new PerhapsM<C.Core>("Aout");
      const tout = new PerhapsM<C.Core>('tout');
      return goOn(
        [
          [Aout, () => arg1.check(context, r, new V.Universe())],
          [tout, () =>
            new S.Arrow(notForInfo(location), arg2, first, rest)
              .check(
                bindFree(context, z, valInContext(context, Aout.value)),
                r,
                new V.Universe()
              )
          ]
        ],
        () => {
          return new go<C.The>(
            new C.The(
              new C.Universe(),
              new C.Pi(
                z,
                Aout.value,
                tout.value
              )
            )
          )
        })
    }
  }

  public static synthPi(context: Context, r: Renaming, location: Location, binders: TypedBinder[], body: S.Source): Perhaps<C.The> {
    if (binders.length === 1) {
      const [binder, type] = [binders[0].binder, binders[0].type];
      const xhat = fresh(context, binder.varName);
      const xloc = binder.location;
      const Aout = new PerhapsM<C.Core>('Aout');
      const Bout = new PerhapsM<C.Core>('Bout');
      return goOn(
        [
          [Aout, () => type.check(context, r, new V.Universe())],
          [Bout, () => body.check(
            bindFree(context, xhat, valInContext(context, Aout.value)),
            extendRenaming(r, binder.varName, xhat),
            new V.Universe())],
        ],
        () => {
          PieInfoHook(xloc, ['binding-site', Aout.value!]);
          return new go<C.The>(
            new C.The(
              new C.Universe(),
              new C.Pi(
                xhat,
                Aout.value,
                Bout.value
              )
            )
          )
        }
      )
    } else if (binders.length > 1) {
      const [fst, ...rest] = binders;
      const [binder, type] = [fst.binder, fst.type];
      const xloc = binder.location;
      const x = binder.varName;
      const xhat = fresh(context, x);
      const Aout = new PerhapsM<C.Core>('Aout');
      const Bout = new PerhapsM<C.Core>('Bout');
      return goOn(
        [
          [Aout, () => type.check(context, r, new V.Universe())],
          [Bout, () =>
            new S.Pi(notForInfo(location), rest, body)
              .check(
                bindFree(context, xhat, valInContext(context, Aout.value)),
                extendRenaming(r, x, xhat),
                new V.Universe()
              )
          ],
        ],
        () => {
          PieInfoHook(xloc, ['binding-site', Aout.value!]);
          return new go<C.The>(
            new C.The(
              new C.Universe(),
              new C.Pi(
                xhat,
                Aout.value,
                Bout.value
              )
            )
          )
        }
      )
    } else {
      throw new Error('Invalid number of binders in Pi type');
    }
  }

  public static synthZero(context: Context, r: Renaming): Perhaps<C.The> {
    return new go(
      new C.The(
        new C.Nat(),
        new C.Zero()
      )
    );
  }


  public static synthAdd1(context: Context, r: Renaming, base: S.Source): Perhaps<C.The> {
    const nout = new PerhapsM<C.Core>('nout');
    return goOn(
      [[nout, () => base.check(context, r, new V.Nat())]],
      () => new go<C.The>(
        new C.The(
          new C.Nat(),
          new C.Add1(nout.value)
        )
      )
    );
  }

  public static synthWhichNat(context: Context, r: Renaming, target: S.Source, base: S.Source, step: S.Source): Perhaps<C.The> {
    const tgtout = new PerhapsM<C.Core>('tgtout');
    const bout = new PerhapsM<C.The>('bout');
    const sout = new PerhapsM<C.Core>('sout');
    let n_minus_1 = fresh(context, 'n_minus_1');
    return goOn(
      [
        [tgtout, () => target.check(context, r, new V.Nat())],
        [bout, () => base.synth(context, r)],
        [sout, () => step.check(
          context,
          r,
          new V.Pi(
            n_minus_1,
            new V.Nat(),
            new FirstOrderClosure(
              contextToEnvironment(context),
              n_minus_1,
              bout.value.type
            )
          ))
        ],
      ],
      () => new go<C.The>(
        new C.The(
          bout.value.type,
          new C.WhichNat(
            tgtout.value,
            new C.The(
              bout.value.type,
              bout.value.expr),
            sout.value
          )
        )
      )
    );
  }



  public static synthIterNat(context: Context, r: Renaming, target: S.Source, base: S.Source, step: S.Source): Perhaps<C.The> {
    const tgtout = new PerhapsM<C.Core>('tgtout');
    const bout = new PerhapsM<C.The>('bout');
    const sout = new PerhapsM<C.Core>('sout');
    return goOn(
      [
        [tgtout, () => target.check(context, r, new V.Nat())],
        [bout, () => base.synth(context, r)],
        [sout, () => step.check(
          context,
          r,
          (() => {
            const old = fresh(context, 'old');
            return valInContext(
              context,
              new C.Pi(
                old,
                bout.value.type,
                bout.value.type
              ))
          })()
        )],
      ],
      () => new go<C.The>(
        new C.The(
          bout.value.type,
          new C.IterNat(
            tgtout.value,
            new C.The(
              bout.value.type,
              bout.value.expr
            ),
            sout.value
          )
        )
      )
    );
  }


  public static synthRecNat(context: Context, r: Renaming, target: S.Source, base: S.Source, step: S.Source): Perhaps<C.The> {
    const tgtout = new PerhapsM<C.Core>('tgtout');
    const bout = new PerhapsM<C.The>('bout');
    const sout = new PerhapsM<C.Core>('sout');
    return goOn(
      [
        [tgtout, () => target.check(context, r, new V.Nat())],
        [bout, () => base.synth(context, r)],
        [sout, () => step.check(
          context,
          r,
          (() => {
            const n_minus_1 = fresh(context, 'n_minus_1');
            const old = fresh(context, 'old');
            return valInContext(
              context,
              new C.Pi(
                n_minus_1,
                new C.Nat(),
                new C.Pi(
                  old,
                  bout.value.type,
                  bout.value.type
                )
              )
            )
          })()
        )],
      ],
      () => new go<C.The>(
        new C.The(
          bout.value.type,
          new C.RecNat(
            tgtout.value,
            new C.The(
              bout.value.type,
              bout.value.expr
            ),
            sout.value
          )
        )
      )
    );
  }


  public static synthIndNat(context: Context, r: Renaming, target: S.Source, motive: S.Source, base: S.Source, step: S.Source): Perhaps<C.The> {
    const tgtout = new PerhapsM<C.Core>('tgtout');
    const motout = new PerhapsM<C.Core>('motout');
    const motval = new PerhapsM<V.Value>('motval');
    const bout = new PerhapsM<C.Core>('bout');
    const sout = new PerhapsM<C.Core>('sout');
    return goOn(
      [
        [tgtout, () => target.check(context, r, new V.Nat())],
        [motout, () => motive.check(context, r,
          new V.Pi(
            'n',
            new V.Nat(),
            new HigherOrderClosure((_) => new V.Universe())
          )
        )],
        [motval, () => new go(
          valInContext(context, motout.value)
        )],
        [bout, () => base.check(
          context,
          r,
          doApp(motval.value, new V.Zero())
        )],
        [sout, () => step.check(
          context,
          r,
          new V.Pi(
            'n-1',
            new V.Nat(),
            new HigherOrderClosure(
              (n_minus_1) =>
                new V.Pi(
                  'x',
                  doApp(motval.value, n_minus_1),
                  new HigherOrderClosure(
                    (_) => doApp(motval.value, new V.Add1(n_minus_1))
                  )
                )
            )
          )
        )],
      ],
      () => new go<C.The>(
        new C.The(
          new C.Application(
            motout.value,
            tgtout.value
          ),
          new C.IndNat(
            tgtout.value,
            motout.value,
            bout.value,
            sout.value
          )
        )
      )
    );
  }

  public static synthAtom(context: Context, r: Renaming): Perhaps<C.The> {
    return new go(
      new C.The(
        new C.Universe(),
        new C.Atom()
      )
    )
  }


  public static synthPair(context: Context, r: Renaming, first: S.Source, second: S.Source): Perhaps<C.The> {
    const a = fresh(context, 'a');
    const Aout = new PerhapsM<C.Core>('Aout');
    const Dout = new PerhapsM<C.Core>('Dout');
    return goOn(
      [
        [Aout, () => first.check(context, r, new V.Universe())],
        [Dout, () =>
          second.check(
            bindFree(context, a, valInContext(context, Aout.value)),
            r,
            new V.Universe()
          )],
      ],
      () => new go<C.The>(
        new C.The(
          new C.Universe(),
          new C.Sigma(
            a,
            Aout.value,
            Dout.value
          )
        )
      )
    );
  }


  public static synthSigma(context: Context, r: Renaming, location: Location, binders: TypedBinder[], body: S.Source): Perhaps<C.The> {
    if (binders.length === 1) {
      const [bd, type] = [binders[0].binder, binders[0].type];
      const xhat = fresh(context, bd.varName);
      const xloc = bd.location;
      const Aout = new PerhapsM<C.Core>('Aout');
      const Dout = new PerhapsM<C.Core>('Dout');
      return goOn(
        [
          [Aout, () => type.check(context, r, new V.Universe())],
          [Dout, () => body.check(
            bindFree(context, xhat, valInContext(context, Aout.value)),
            extendRenaming(r, bd.varName, xhat),
            new V.Universe()
          )],
        ],
        () => {
          PieInfoHook(xloc, ['binding-site', Aout.value!]);
          return new go<C.The>(
            new C.The(
              new C.Universe(),
              new C.Sigma(
                xhat,
                Aout.value,
                Dout.value
              )
            )
          )
        }
      )
    } else if (binders.length > 1) {
      const [fst, ...rest] = binders;
      const [binder, type] = [fst.binder, fst.type];
      const xloc = binder.location;
      const x = binder.varName;
      const xhat = fresh(context, x);
      const Aout = new PerhapsM<C.Core>('Aout');
      const Dout = new PerhapsM<C.Core>('Dout');
      return goOn(
        [
          [Aout, () => type.check(context, r, new V.Universe())],
          [Dout, () =>
            new S.Sigma(
              notForInfo(location),
              rest,
              body
            ).check(
              bindFree(context, xhat, valInContext(context, Aout.value)),
              extendRenaming(r, x, xhat),
              new V.Universe()
            )
          ],
        ],
        () => {
          PieInfoHook(xloc, ['binding-site', Aout.value]);
          return new go<C.The>(
            new C.The(
              new C.Universe(),
              new C.Sigma(
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

  public static synthCar(context: Context, r: Renaming, location: Location, pair: S.Source): Perhaps<C.The> {
    const pout = new PerhapsM<C.The>('p_rst');
    return goOn(
      [[pout, () => pair.synth(context, r)]],
      () => {
        const val = valInContext(context, pout.value.type);
        if (val instanceof V.Sigma) {
          return new go(
            new C.The(
              val.carType.readBackType(context),
              new C.Car(
                pout.value.expr,
              )
            )
          )
        } else {
          return new stop(
            location,
            new Message([`car requires a Pair type, but was used as a: ${val}.`])
          );
        }
      }
    )
  }

  public static synthCdr(context: Context, r: Renaming, location: Location, pair: S.Source): Perhaps<C.The> {
    const pout = new PerhapsM<C.The>('pout');
    return goOn(
      [[pout, () => pair.synth(context, r)]],
      () => {
        const val = valInContext(context, pout.value.type);
        if (val instanceof V.Sigma) {
          const [x, A, clos] = [val.carName, val.carType, val.cdrType];
          return new go(
            new C.The(
              clos.valOfClosure(
                doCar(valInContext(context, pout.value.expr))
              ).readBackType(context),
              new C.Cdr(
                pout.value.expr,
              )
            )
          );
        } else {
          return new stop(
            location,
            new Message([`cdr requires a Pair type, but was used as a: ${val}.`])
          );
        }
      }
    )
  }

  public static synthQuote(context: Context, r: Renaming, location: Location, atom: string): Perhaps<C.The> {
    if (atomOk(atom)) {
      return new go(
        new C.The(
          new C.Atom(),
          new C.Quote(atom)
        )
      );
    } else {
      return new stop(
        location,
        new Message([`Invalid atom: ${atom}. Atoms consist of letters and hyphens.`])
      );
    }
  }

  public static synthTrivial(context: Context, r: Renaming): Perhaps<C.The> {
    return new go(
      new C.The(
        new C.Universe(),
        new C.Trivial()
      )
    );
  }

  public static synthSole(context: Context, r: Renaming): Perhaps<C.The> {
    return new go(
      new C.The(
        new C.Trivial(),
        new C.Sole()
      )
    )
  }

  public static synthIndList(context: Context, r: Renaming,
    location: Location, target: S.Source, motive: S.Source, base: S.Source, step: S.Source,): Perhaps<C.The> {
    const tgtout = new PerhapsM<C.The>('tgtout');
    const motout = new PerhapsM<C.Core>('motout');
    const motval = new PerhapsM<V.Value>('motval');
    const bout = new PerhapsM<C.Core>('bout');
    const sout = new PerhapsM<C.Core>('sout');
    return goOn(
      [
        [tgtout, () => target.synth(context, r)],
      ],
      (() => {
        const [tgt_t, tgt_e] = [tgtout.value.type, tgtout.value.expr];
        const type = valInContext(context, tgt_t);
        if (type instanceof V.List) {
          const E = type.entryType;
          return goOn(
            [
              [
                motout,
                () => motive.check(
                  context,
                  r,
                  new V.Pi(
                    'xs',
                    new V.List(E),
                    new FirstOrderClosure(
                      contextToEnvironment(context),
                      'xs',
                      new C.Universe()
                    )
                  )
                )
              ],
              [motval, () => new go(valInContext(context, motout.value))],
              [bout, () => base.check(
                context,
                r,
                doApp(motval.value, new V.Nil())
              )],
              [sout, () => step.check(
                context,
                r,
                new V.Pi(
                  'e',
                  E,
                  new HigherOrderClosure(
                    (e) => new V.Pi(
                      'es',
                      new V.List(E),
                      new HigherOrderClosure(
                        (es) => new V.Pi(
                          'ih',
                          doApp(motval.value, es),
                          new HigherOrderClosure(
                            (_) => doApp(motval.value, new V.ListCons(e, es))
                          )
                        )
                      )
                    )
                  )
                )
              )],
            ],
            () => new go<C.The>(
              new C.The(
                new C.Application(
                  motout.value,
                  tgt_e
                ),
                new C.IndList(
                  tgt_e,
                  motout.value,
                  bout.value,
                  sout.value
                )
              )
            )
          );
        } else {
          return new stop(
            location,
            new Message([`Not a List: ${type.readBackType(context)}.`])
          );
        }
      })
    )
  }


  public static synthRecList(context: Context, r: Renaming,
    location: Location, target: S.Source, base: S.Source, step: S.Source,): Perhaps<C.The> {
    const tgtout = new PerhapsM<C.The>('tgtout');
    return goOn(
      [[tgtout, () => target.synth(context, r)]],
      () => {
        const [tgt_t, tgt_e] = [tgtout.value.type, tgtout.value.expr];
        const type = valInContext(context, tgt_t);
        if (type instanceof V.List) {
          const E = type.entryType;
          const bout = new PerhapsM<C.The>('bout');
          const btval = new PerhapsM<V.Value>('btval');
          const sout = new PerhapsM<C.Core>('sout');
          return goOn(
            [
              [bout, () => base.synth(context, r)],
              [btval, () => new go(valInContext(context, bout.value.type))],
              [sout, () =>
                step.check(
                  context,
                  r,
                  new V.Pi(
                    'e',
                    E,
                    new HigherOrderClosure(
                      (_) => new V.Pi(
                        'es',
                        new V.List(E),
                        new HigherOrderClosure(
                          (_) => new V.Pi(
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
                )
              ],
            ],
            () => new go<C.The>(
              new C.The(
                bout.value.type,
                new C.RecList(
                  tgt_e,
                  new C.The(
                    bout.value.type,
                    bout.value.expr
                  ),
                  sout.value
                )
              )
            )
          );
        } else {
          return new stop(
            location,
            new Message([`Not a List: ${type.readBackType(context)}.`])
          );
        }
      }
    )
  }


  public static synthList(context: Context, r: Renaming, e: S.List): Perhaps<C.The> {
    const Eout = new PerhapsM<C.Core>('Eout');
    return goOn(
      [[Eout, () => e.entryType.check(context, r, new V.Universe())]],
      () => new go<C.The>(
        new C.The(
          new C.Universe(),
          new C.List(Eout.value)
        )
      )
    );
  }


  public static synthListCons(context: Context, r: Renaming, x: S.Source, xs: S.Source): Perhaps<C.The> {
    const fstout = new PerhapsM<C.The>('eout');
    const restout = new PerhapsM<C.Core>('esout');
    return goOn(
      [
        [fstout, () => x.synth(context, r)],
        [restout, () =>
          xs.check(
            context,
            r,
            valInContext(context, new C.List(fstout.value.type))
          )
        ],
      ],
      () => new go<C.The>(
        new C.The(
          new C.List(fstout.value.type),
          new C.ListCons(
            fstout.value.expr,
            restout.value
          )
        )
      )
    );
  }

  public static synthAbsurd(context: Context, r: Renaming, e: S.Absurd): Perhaps<C.The> {
    return new go(
      new C.The(
        new C.Universe(),
        new C.Absurd()
      )
    );
  }



  public static synthIndAbsurd(context: Context, r: Renaming, e: S.IndAbsurd): Perhaps<C.The> {
    const tgtout = new PerhapsM<C.Core>('tgtout');
    const motout = new PerhapsM<C.Core>('motout');
    return goOn(
      [
        [tgtout, () => e.target.check(context, r, new V.Absurd())],
        [motout, () => e.motive.check(context, r, new V.Universe())],
      ],
      () => new go<C.The>(
        new C.The(
          motout.value,
          new C.IndAbsurd(
            tgtout.value,
            motout.value
          )
        )
      )
    );
  }



  public static synthEqual(context: Context, r: Renaming, type: S.Source, left: S.Source, right: S.Source): Perhaps<C.The> {
    const Aout = new PerhapsM<C.Core>('Aout');
    const Av = new PerhapsM<V.Value>('Av');
    const from_out = new PerhapsM<C.Core>('from_out');
    const to_out = new PerhapsM<C.Core>('to_out');
    return goOn(
      [
        [Aout, () => type.check(context, r, new V.Universe())],
        [Av, () => new go(valInContext(context, Aout.value))],
        [from_out, () => left.check(context, r, Av.value)],
        [to_out, () => right.check(context, r, Av.value)],
      ],
      () => new go<C.The>(
        new C.The(
          new C.Universe(),
          new C.Equal(
            Aout.value,
            from_out.value,
            to_out.value
          )
        )
      )
    );
  }


  public static synthReplace(context: Context, r: Renaming, location: Location, target: S.Source, motive: S.Source, base: S.Source): Perhaps<C.The> {
    const tgtout = new PerhapsM<C.The>('tgt_rst');
    const motout = new PerhapsM<C.Core>('motout');
    const bout = new PerhapsM<C.Core>('bout');
    return goOn(
      [[tgtout, () => target.synth(context, r)]],
      () => {
        const result = valInContext(context, tgtout.value.type);
        if (result instanceof V.Equal) {
          const [Av, fromv, tov] = [result.type, result.from, result.to];
          return goOn(
            [
              [motout, () =>
                motive.check(
                  context,
                  r,
                  new V.Pi(
                    'x',
                    Av,
                    new HigherOrderClosure(
                      (_) => new V.Universe()
                    )
                  )
                )
              ],
              [bout, () => base.check(
                context,
                r,
                doApp(valInContext(context, motout.value), fromv)
              )],
            ],
            () => new go(
              new C.The(
                (doApp(valInContext(context, motout.value), tov)).readBackType(context),
                new C.Replace(
                  tgtout.value.expr,
                  motout.value,
                  bout.value
                )
              )
            )
          );
        } else {
          return new stop(
            location,
            new Message([`Expected an expression with = type, but the type was: ${tgtout.value.type}.`])
          );
        }
      }
    );
  }

  public static synthTrans(context: Context, r: Renaming, location: Location, left: S.Source, right: S.Source): Perhaps<C.The> {

    const lout = new PerhapsM<C.The>('p1_rst');
    const rout = new PerhapsM<C.The>('p2_rst');
    return goOn(
      [
        [lout, () => left.synth(context, r)],
        [rout, () => right.synth(context, r)],
      ],
      () => {
        const result1 = valInContext(context, lout.value.type);
        const result2 = valInContext(context, rout.value.type);
        if (result1 instanceof V.Equal && result2 instanceof V.Equal) {
          const [Av, fromv, midv] = [result1.type, result1.from, result1.to];
          const [Bv, midv2, tov] = [result2.type, result2.from, result2.to];

          return goOn(
            [
              [new PerhapsM("_"), () => sameType(context, location, Av, Bv)],
              [new PerhapsM("_"), () => convert(context, location, Av, midv, midv2)],
            ],
            () => new go<C.The>(
              new C.The(
                new V.Equal(Av, fromv, tov).readBackType(context),
                new C.Trans(
                  lout.value.expr,
                  rout.value.expr
                )
              )
            )
          );
        } else {
          return new stop(
            location,
            new Message([`Expected =, got ${result1} and ${result2}.`])
          );
        }
      }
    )
  }

  public static synthCong(context: Context, r: Renaming, location: Location, base: S.Source, fun: S.Source): Perhaps<C.The> {

    const bout = new PerhapsM<C.The>('bout');
    const fout = new PerhapsM<C.The>('f_rst');
    return goOn(
      [
        [bout, () => base.synth(context, r)],
        [fout, () => fun.synth(context, r)],
      ],
      () => {
        const result1 = valInContext(context, bout.value.type);
        const result2 = valInContext(context, fout.value.type);
        if (result1 instanceof V.Equal) {
          const [Av, fromv, tov] = [result1.type, result1.from, result1.to];
          if (result2 instanceof V.Pi) {
            const [x, Bv, c] = [result2.argName, result2.argType, result2.resultType];
            const ph = new PerhapsM<any>('ph');
            const Cv = new PerhapsM<V.Value>('Cv');
            const fv = new PerhapsM<V.Value>('fv');
            return goOn(
              [
                [ph, () => sameType(context, location, Av, Bv)],
                [Cv, () => new go(c.valOfClosure(fromv))],
                [fv, () => new go(valInContext(context, fout.value.expr))],
              ],
              () => new go(
                new C.The(
                  new C.Equal(
                    Cv.value.readBackType(context),
                    readBack(context, Cv.value, doApp(fv.value, fromv)),
                    readBack(context, Cv.value, doApp(fv.value, tov))
                  ),
                  new C.Cong(
                    bout.value.expr,
                    Cv.value.readBackType(context),
                    fout.value.expr
                  )
                )
              )
            );
          } else {
            return new stop(
              location,
              new Message([`Expected a function type, got ${result2.readBackType(context)}.`])
            );
          }
        } else {
          return new stop(
            location,
            new Message([`Expected an = type, got ${result1.readBackType(context)}.`])
          );
        }
      }
    )
  }

  public static synthSymm(context: Context, r: Renaming, location: Location, eq: S.Source): Perhaps<C.The> {
    const eout = new PerhapsM<C.The>('eout');
    return goOn(
      [[eout, () => eq.synth(context, r)]],
      () => {
        const result = valInContext(context, eout.value.type);
        if (result instanceof V.Equal) {
          const [Av, fromv, tov] = [result.type, result.from, result.to];
          return new go(
            new C.The(
              (new V.Equal(
                Av,
                tov,
                fromv
              )).readBackType(context),
              new C.Symm(
                eout.value.expr
              )
            )
          );
        } else {
          return new stop(
            location,
            new Message([`Expected an = type, got ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }


  public static synthIndEqual(context: Context, r: Renaming, location: Location, target: S.Source, motive: S.Source, base: S.Source): Perhaps<C.The> {
    const tgtout = new PerhapsM<C.The>('tgtout');
    const motout = new PerhapsM<C.Core>('motout');
    const motv = new PerhapsM<V.Value>('motv');
    const baseout = new PerhapsM<C.Core>('baseout');
    return goOn(
      [[tgtout, () => target.synth(context, r)]],
      () => {
        const result = valInContext(context, tgtout.value.type);
        if (result instanceof V.Equal) {
          const [Av, fromv, tov] = [result.type, result.from, result.to];
          return goOn(
            [
              [motout, () =>
                motive.check(
                  context,
                  r,
                  new V.Pi(
                    'to',
                    Av,
                    new HigherOrderClosure(
                      (to) => new V.Pi(
                        'p',
                        new V.Equal(Av, fromv, to),
                        new HigherOrderClosure(
                          (_) => new V.Universe()
                        )
                      )
                    )
                  )
                )
              ],
              [motv, () => new go(valInContext(context, motout.value))],
              [baseout, () =>
                base.check(
                  context,
                  r,
                  doApp(doApp(motv.value, fromv), new V.Same(fromv))
                )
              ],
            ],
            () => new go<C.The>(
              new C.The(
                doApp(
                  doApp(motv.value, tov),
                  valInContext(context, tgtout.value.expr)
                ).readBackType(context),
                new C.IndEqual(
                  tgtout.value.expr,
                  motout.value,
                  baseout.value
                )
              )
            )
          );
        } else {
          return new stop(
            location,
            new Message([`Expected evidence of equality, got ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }


  public static synthVec(context: Context, r: Renaming, type: S.Source, len: S.Source): Perhaps<C.The> {
    const tout = new PerhapsM<C.Core>('tout');
    const lenout = new PerhapsM<C.Core>('lenout');
    return goOn(
      [
        [tout, () => type.check(context, r, new V.Universe())],
        [lenout, () => len.check(context, r, new V.Nat())],
      ],
      () => new go<C.The>(
        new C.The(
          new C.Universe(),
          new C.Vec(tout.value, lenout.value)
        )
      )
    );
  }


  public static synthHead(context: Context, r: Renaming, location: Location, vec: S.Source): Perhaps<C.The> {
    const vout = new PerhapsM<C.The>('vout');
    return goOn(
      [[vout, () => vec.synth(context, r)]],
      () => {
        const result = valInContext(context, vout.value.type).now();
        if (result instanceof V.Vec) {
          const [T, len] = [result.entryType, result.length];
          const lenNow = len.now();
          if (lenNow instanceof V.Add1) {
            return new go(
              new C.The(
                T.readBackType(context),
                new C.Head(
                  vout.value.expr
                )
              )
            );
          } else {
            return new stop(
              location,
              new Message([`Expected a Vec with add1 at the top of the length, got ${readBack(context, new V.Nat(), len)}.`])
            );
          }
        } else {
          return new stop(
            location,
            new Message([`Expected a Vec, got ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }

  public static synthTail(context: Context, r: Renaming, location: Location, vec: S.Source): Perhaps<C.The> {
    const vout = new PerhapsM<C.The>('vout');
    return goOn(
      [[vout, () => vec.synth(context, r)]],
      () => {
        const result = valInContext(context, vout.value.type).now();
        if (result instanceof V.Vec) {
          const [T, len] = [result.entryType, result.length];
          const lenNow = len.now();
          if (lenNow instanceof V.Add1) {
            const len_minus_1 = lenNow.smaller;
            return new go(
              new C.The(
                new C.Vec(
                  T.readBackType(context),
                  readBack(context, new V.Nat(), len_minus_1)),
                new C.Tail(
                  vout.value.expr
                )
              )
            );
          } else {
            return new stop(
              location,
              new Message([`Expected a Vec with add1 at the top of the length, got ${readBack(context, new V.Nat(), len)}.`])
            );
          }
        } else {
          return new stop(
            location,
            new Message([`Expected a Vec, got ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }

  public static synthIndVec(context: Context, r: Renaming, location: Location,
    length: S.Source, target: S.Source, motive: S.Source, base: S.Source, step: S.Source): Perhaps<C.The> {
    const lenout = new PerhapsM<C.Core>('lenout');
    const lenv = new PerhapsM<V.Value>('lenv');
    const vecout = new PerhapsM<C.The>('vecout');
    const motout = new PerhapsM<C.Core>('motout');
    const motval = new PerhapsM<V.Value>('motval');
    const bout = new PerhapsM<C.Core>('bout');
    const sout = new PerhapsM<C.Core>('sout');
    return goOn(
      [
        [lenout, () => length.check(context, r, new V.Nat())],
        [lenv, () => new go(valInContext(context, lenout.value))],
        [vecout, () => target.synth(context, r)],
      ],
      () => {
        const result = valInContext(context, vecout.value.type);
        if (result instanceof V.Vec) {
          const [E, len2v] = [result.entryType, result.length];
          return goOn(
            [
              [new PerhapsM<any>('_'), () => convert(context, location, new V.Nat(), lenv.value, len2v)],
              [motout, () => motive.check(
                context,
                r,
                new V.Pi(
                  'k',
                  new V.Nat(),
                  new HigherOrderClosure(
                    (k) => new V.Pi(
                      'es',
                      new V.Vec(E, k),
                      new HigherOrderClosure(
                        (_) => new V.Universe()
                      )
                    )
                  )
                )
              )],
              [motval, () => new go(valInContext(context, motout.value))],
              [bout, () => base.check(
                context,
                r,
                doApp(doApp(motval.value, new V.Zero()), new V.VecNil())
              )],
              [sout, () => step.check(
                context,
                r,
                indVecStepType(E, motval.value)
              )],
            ],
            () => new go<C.The>(
              new C.The(
                new C.Application(
                  new C.Application(
                    motout.value,
                    lenout.value
                  ),
                  vecout.value.expr
                ),
                new C.IndVec(
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
            location,
            new Message([`Expected a Vec, got ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }

  public static synthEither(context: Context, r: Renaming, left: S.Source, right: S.Source): Perhaps<C.The> {
    const Lout = new PerhapsM<C.Core>('Lout');
    const Rout = new PerhapsM<C.Core>('Rout');
    return goOn(
      [
        [Lout, () => left.check(context, r, new V.Universe())],
        [Rout, () => right.check(context, r, new V.Universe())],
      ],
      () => new go<C.The>(
        new C.The(
          new C.Universe(),
          new C.Either(Lout.value, Rout.value)
        )
      )
    );
  }


  public static synthIndEither(context: Context, r: Renaming, location: Location, target: S.Source,
    motive: S.Source, baseLeft: S.Source, baseRight: S.Source,): Perhaps<C.The> {
    const tgtout = new PerhapsM<C.The>('tgtout');
    const motout = new PerhapsM<C.Core>('motout');
    const motval = new PerhapsM<V.Value>('motval');
    const lout = new PerhapsM<C.Core>('lout');
    const rout = new PerhapsM<C.Core>('rout');
    return goOn(
      [[tgtout, () => target.synth(context, r)]],
      () => {
        const result = valInContext(context, tgtout.value.type);
        if (result instanceof V.Either) {
          const [Lv, Rv] = [result.leftType, result.rightType];
          return goOn(
            [
              [motout, () =>
                motive.check(
                  context,
                  r,
                  new V.Pi(
                    'x',
                    new V.Either(Lv, Rv),
                    new HigherOrderClosure(
                      (_) => new V.Universe()
                    )
                  )
                )
              ],
              [motval, () => new go(valInContext(context, motout.value))],
              [lout, () => baseLeft.check(
                context,
                r,
                new V.Pi(
                  'x',
                  Lv,
                  new HigherOrderClosure(
                    (x) => doApp(motval.value, new V.Left(x))
                  )
                )
              )],
              [rout, () => baseRight.check(
                context,
                r,
                new V.Pi(
                  'x',
                  Rv,
                  new HigherOrderClosure(
                    (x) => doApp(motval.value, new V.Right(x))
                  )
                )
              )],
            ],
            () => new go<C.The>(
              new C.The(
                new C.Application(
                  motout.value,
                  tgtout.value.expr
                ),
                new C.IndEither(
                  tgtout.value.expr,
                  motout.value,
                  lout.value,
                  rout.value
                )
              )
            )
          );
        } else {
          return new stop(
            location,
            new Message([`Expected an Either, but got a ${result.readBackType(context)}.`])
          );
        }
      }
    );
  }

  public static synthThe(context: Context, r: Renaming, type: S.Source, value: S.Source): Perhaps<C.The> {
    const tout = new PerhapsM<C.Core>('t_out');
    const eout = new PerhapsM<C.Core>('e_out');
    return goOn(
      [
        [tout, () => type.isType(context, r)],
        [eout, () => value.check(context, r, valInContext(context, tout.value))],
      ],
      () => new go<C.The>(
        new C.The(
          tout.value,
          eout.value
        )
      )
    );
  }

  public static synthApplication(context: Context, r: Renaming, location: Location, fun: S.Source, arg: S.Source, args: S.Source[]): Perhaps<C.The> {
    if (args.length === 0) {
      const fout = new PerhapsM<C.The>('fout');
      return goOn(
        [[fout, () => fun.synth(context, r)]],
        () => {
          const result = valInContext(context, fout.value.type);
          if (result instanceof V.Pi) {
            const [_, A, c] = [result.argName, result.argType, result.resultType];
            const argout = new PerhapsM<C.Core>('argout');
            return goOn(
              [[argout, () => arg.check(context, r, A)]],
              () =>
                new go(
                  new C.The(
                    c.valOfClosure(valInContext(context, argout.value)).readBackType(context),
                    new C.Application(
                      fout.value.expr,
                      argout.value
                    )
                  )
                )
            );
          } else {
            return new stop(
              location,
              new Message([`Not a function type: ${result.readBackType(context)}.`])
            );
          }
        }
      );
    } else {
      const appout = new PerhapsM<C.The>('appout');
      return goOn(
        [[appout, () => (
          new S.Application(
            notForInfo(location),
            fun,
            arg,
            args.slice(0, args.length - 1)
          )
        ).synth(context, r)]],
        () => {
          const result = valInContext(context, appout.value.type);
          if (result instanceof V.Pi) {
            const [x, A, c] = [result.argName, result.argType, result.resultType];
            const argout = new PerhapsM<C.Core>('fout');
            return goOn(
              [[argout, () => args[args.length - 1].check(context, r, A)]],
              () => new go(
                new C.The(
                  c.valOfClosure(valInContext(context, argout.value)).readBackType(context),
                  new C.Application(
                    appout.value.expr,
                    argout.value
                  )
                )
              )
            );
          } else {
            return new stop(
              location,
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

  public static synthName(context: Context, r: Renaming, location: Location, name: string): Perhaps<C.The> {
    const real_x = rename(r, name);
    const x_tv = new PerhapsM<V.Value>('x_tv');
    return goOn(
      [[x_tv, () => varType(context, location, real_x)]],
      () => {
        const result = context.get(real_x);
        if (result instanceof Define) {
          PieInfoHook(location, 'definition');
        }
        // If it's an inductive datatype, return the type constructor, not a variable reference
        if (result instanceof InductiveDatatypeBinder) {
          const inductiveType = result.type;
          return new go(
            new C.The(
              new C.Universe(),
              new C.InductiveTypeConstructor(
                inductiveType.name,
                inductiveType.parameterTypes.map(p => p.readBackType(context)),
                inductiveType.indexTypes.map(i => i.readBackType(context))
              )
            )
          );
        }
        return new go(
          new C.The(
            x_tv.value.readBackType(context),
            new C.VarName(real_x)
          )
        )
      }
    );
  }

  public static synthNumber(context: Context, r: Renaming, location: Location, value: number): Perhaps<C.The> {
    if (value === 0) {
      return new go(
        new C.The(
          new C.Nat(),
          new C.Zero()
        )
      );
    } else if (value > 0) {
      const n_minus_1_out = new PerhapsM<C.Core>('n_1_out');
      return goOn(
        [[n_minus_1_out, () => (new S.Number(location, value - 1)).check(context, r, new V.Nat())]],
        () => new go(
          new C.The(
            new C.Nat(),
            new C.Add1(n_minus_1_out.value)
          )
        )
      );
    } else {
      return new stop(
        location,
        new Message([`Expected a positive number, got ${value}.`])
      );
    }
  }

  // ==================== INDUCTIVE DATATYPES ====================

  /**
   * Synthesize constructor application for user-defined inductive types
   */
  public static synthConstructorApplication(ctx: Context, r: Renaming, ctorApp: S.ConstructorApplication): Perhaps<C.The> {
    // Look up constructor in context
    const constructorBinder = ctx.get(ctorApp.constructorName);
    if (!constructorBinder || !(constructorBinder instanceof ConstructorTypeBinder)) {
      throw new Error(`Unknown constructor: ${ctorApp.constructorName}`);
    }

    const ctorType = constructorBinder.constructorType
    const argTypes = ctorType.argTypes.concat(ctorType.rec_argTypes)

    let cur_ctx = ctx
    let cur_rename = r

    if(argTypes.length !== ctorApp.args.length) {
      return new stop(ctorApp.location,
        new Message([`Expected ${argTypes.length} arguments, got ${ctorApp.args.length}`]));
    }

    const checkedArgs: C.Core[] = [];

    // Build an environment for checking arguments
    // For parameterized constructors, we need to bind type parameters first
    let argCheckEnv = new Map(contextToEnvironment(ctx));

    // First pass: check type parameters and build environment
    const typeParamValues: V.Value[] = [];
    for (let i = 0; i < ctorType.numTypeParams && i < ctorApp.args.length; i++) {
      // Type parameter: should check against Universe
      const argCheck = ctorApp.args[i].check(cur_ctx, cur_rename, new V.Universe());
      if (argCheck instanceof stop) return argCheck;
      const checkedArg = (argCheck as go<C.Core>).result;
      checkedArgs.push(checkedArg);

      // Store the actual type value
      const paramValue = valInContext(ctx, checkedArg);
      typeParamValues.push(paramValue);

      // Try to extract parameter name from argTypes to bind in environment
      // argTypes[i] for type params might be Universe or VarName
      // We need to find VarNames in subsequent argTypes and bind them
      const extractAndBindVarNames = (core: C.Core, value: V.Value) => {
        if (core instanceof C.VarName) {
          argCheckEnv.set(core.name, value);
        }
      };

      // Look through remaining argTypes to find references to this parameter
      for (let j = i + 1; j < argTypes.length; j++) {
        if (argTypes[j] instanceof C.VarName) {
          // This might be the parameter we just checked
          // Bind it speculatively - if it's the wrong one, it won't match anyway
          argCheckEnv.set((argTypes[j] as C.VarName).name, paramValue);
        }
      }
    }

    // Second pass: check remaining arguments with type parameters bound
    for (let i = ctorType.numTypeParams; i < ctorApp.args.length; i++) {
      // Regular argument: check against its type (evaluated with type params bound)
      const argType = argTypes[i].valOf(argCheckEnv);
      const argCheck = ctorApp.args[i].check(cur_ctx, cur_rename, argType);
      if (argCheck instanceof stop) return argCheck;
      const checkedArg = (argCheck as go<C.Core>).result;
      checkedArgs.push(checkedArg);

      // Bind this argument's value in the environment using its actual name
      // Now we have argNames available from the constructor type!
      if (i < ctorType.argNames.length) {
        const argName = ctorType.argNames[i];
        const argValue = valInContext(ctx, checkedArg);
        argCheckEnv.set(argName, argValue);
      }
    }

    // Compute the specific result type by substituting type parameters
    let specificResultType: V.Value;

    if (ctorType.numTypeParams > 0) {
      // For parameterized constructors: substitute type parameters with actual values
      // Build an environment where type parameter variables are bound to actual type values
      const typeParamEnv = new Map(contextToEnvironment(ctx));

      // The result type contains VarName references to type parameters (like 'E')
      // We need to evaluate it in an environment where those are bound to the actual types
      // Extract actual type parameter values
      const typeParamValues: V.Value[] = [];
      for (let i = 0; i < ctorType.numTypeParams; i++) {
        typeParamValues.push(valInContext(ctx, checkedArgs[i]));
      }

      // Create environment with type parameters bound
      // We need to know the NAMES of the type parameters from the constructor definition
      // These names are embedded in the resultType as VarNames
      // For MyList, resultType is: InductiveTypeConstructor('MyList', [VarName('E')], [])

      // Extract VarNames from resultType to find parameter names
      const extractVarNames = (core: C.Core): string[] => {
        if (core instanceof C.VarName) return [core.name];
        if (core instanceof C.InductiveTypeConstructor) {
          // Extract from both parameters AND indices
          return [
            ...core.parameters.flatMap(p => extractVarNames(p)),
            ...core.indices.flatMap(i => extractVarNames(i))
          ];
        }
        if (core instanceof C.Add1) {
          return extractVarNames(core.n);
        }
        return [];
      };

      const paramNames = extractVarNames(ctorType.resultType);

      // Bind each parameter name to its actual value in a temporary environment
      for (let i = 0; i < Math.min(paramNames.length, typeParamValues.length); i++) {
        typeParamEnv.set(paramNames[i], typeParamValues[i]);
      }

      // Also bind all checked arguments (including non-type-parameter args like 'k' in MyVec)
      // We need to bind ALL constructor arguments, not just type parameters
      // Extract all arg type VarNames and bind them to corresponding checked values
      const allArgNames: string[] = [];
      for (let i = 0; i < argTypes.length; i++) {
        const argVarNames = extractVarNames(argTypes[i]);
        if (argVarNames.length === 0 && argTypes[i] instanceof C.VarName) {
          // The argType itself might not contain VarNames, but we need its name
          // Actually, we need to find the parameter NAME from the original constructor definition
          // For now, let's just bind all checked argument values by index
        }
      }

      // Bind each checked argument value to the environment
      // We need to figure out the variable names for constructor arguments
      // For myveccons: args are [E, k, head, tail]
      // argTypes are [Universe, Nat, VarName('E'), InductiveTypeConstructor('MyVec', [VarName('E')], [VarName('k')])]
      // We need to bind k -> checkedArgs[1] value
      // The challenge is knowing that argTypes[1] corresponds to variable name 'k'

      // Alternative approach: bind all checked args with sequential names or by extracting from Core
      // Actually, the best approach is to evaluate the resultType with ALL arguments bound
      // Let's find all VarNames in argTypes and bind them to checked argument values
      const bindArgValue = (argTypeCore: C.Core, argIndex: number) => {
        // This arg type might reference previous args by name
        // We should have bound them already in argCheckEnv
        // For the current arg, if we can determine its name, bind its value
      };

      // Simpler approach: extend typeParamEnv with all values from argCheckEnv that were bound
      // during argument checking
      for (const [name, value] of argCheckEnv) {
        if (!typeParamEnv.has(name)) {
          typeParamEnv.set(name, value);
        }
      }

      // Now evaluate the result type with the substituted environment
      specificResultType = ctorType.resultType.valOf(typeParamEnv);
    } else {
      // For non-parameterized constructors: still need to use argCheckEnv
      // to bind any constructor arguments referenced in the result type
      specificResultType = ctorType.resultType.valOf(argCheckEnv);
    }

    return new go(new C.The(
      specificResultType.readBackType(ctx),
      new C.Constructor(
        ctorApp.constructorName,
        ctorType.index,
        ctorType.type,
        checkedArgs.slice(0, ctorType.argTypes.length),
        checkedArgs.slice(ctorType.argTypes.length)
      )
    ));

  }

  /**
   * Synthesize eliminator application for user-defined inductive types
   */
  public static synthGeneralEliminator(ctx: Context, r: Renaming, elimApp: S.EliminatorApplication): Perhaps<C.The> {
    // PHASE 1: Look up inductive datatype in context
    const inductiveTypeResult = getInductiveType(ctx, elimApp.location, elimApp.typeName);
    if (inductiveTypeResult instanceof stop) return inductiveTypeResult;

    const inductiveBinder = (inductiveTypeResult as go<InductiveDatatypeBinder>).result;
    const inductiveTypeValue = inductiveBinder.type; // V.InductiveType

    // PHASE 2: Synthesize & Check Target
    const targetSynth = elimApp.target.synth(ctx, r);
    if (targetSynth instanceof stop) return targetSynth;

    const targetThe = (targetSynth as go<C.The>).result;
    const targetTypeValue = valInContext(ctx, targetThe.type);

    // Verify target type matches the inductive type
    if (!(targetTypeValue instanceof V.InductiveTypeConstructor) ||
        targetTypeValue.name !== elimApp.typeName) {
      return new stop(elimApp.location,
        new Message([`Expected type ${elimApp.typeName}, got ${targetTypeValue.readBackType(ctx)}`]));
    }

    // PHASE 3: Generate & Check Motive Type
    // Generate expected motive type: (Π [target : T] U)
    let indexTypes = inductiveTypeValue.indexTypes
    const buildMotive = (level: number, capturedIndices: V.Value[]): V.Value => {
          if (level >= indexTypes.length) {
            // Base case: build (Π [target : InductiveType(name, params, capturedIndices)] U)
            return new V.Pi(
              'target',
              new V.InductiveTypeConstructor(targetTypeValue.name, targetTypeValue.parameters, capturedIndices),
              new HigherOrderClosure(_ => new V.Universe())
            );
          }
    
          // Recursive case: build (Π [index : τ] ...)
          const indexType = indexTypes[level];
          return new V.Pi(
            fresh(ctx, 'idx'),
            indexType,
            new HigherOrderClosure(indexVal =>
              buildMotive(level + 1, [...capturedIndices, indexVal])
            )
          );
        };
    
    const expectedMotiveType = buildMotive(0, [])

    const motiveCheck = elimApp.motive.check(ctx, r, expectedMotiveType);
    if (motiveCheck instanceof stop) return motiveCheck;

    const motiveCore = (motiveCheck as go<C.Core>).result;
    const motiveValue = valInContext(ctx, motiveCore);

    // PHASE 4: Get constructor types and check methods
    const constructorTypes = this.getConstructorTypesForDatatype(ctx, elimApp.typeName);

    if (elimApp.methods.length !== constructorTypes.length) {
      return new stop(elimApp.location,
        new Message([`Expected ${constructorTypes.length} methods, got ${elimApp.methods.length}`]));
    }

    const checkedMethods: C.Core[] = [];
    for (let i = 0; i < elimApp.methods.length; i++) {
      const expectedMethodType = this.generateMethodTypeForConstructor(
        ctx,
        constructorTypes[i],
        motiveValue,
        targetTypeValue.parameters
      );

      const methodCheck = elimApp.methods[i].check(ctx, r, expectedMethodType);
      if (methodCheck instanceof stop) return methodCheck;

      checkedMethods.push((methodCheck as go<C.Core>).result);
    }

    // PHASE 5: Compute Result Type & Build Core
    // For indexed types, apply motive to indices first, then target
    let resultType: V.Value = motiveValue;

    // Apply to each index value from the target's type
    for (const indexValue of targetTypeValue.indices) {
      resultType = doApp(resultType, indexValue);
    }

    // Finally apply to the target value itself
    resultType = doApp(resultType, valInContext(ctx, targetThe.expr));

    const eliminatorCore = new C.Eliminator(
      elimApp.typeName,
      targetThe.expr,
      motiveCore,
      checkedMethods
    );

    return new go(new C.The(
      resultType.readBackType(ctx),
      eliminatorCore
    ));
  }

  /**
   * Get constructor types for a datatype from context
   */
  private static getConstructorTypesForDatatype(ctx: Context, typeName: string): C.ConstructorType[] {
    const constructorTypes: C.ConstructorType[] = [];

    for (const [name, binder] of ctx) {
      if (binder instanceof ConstructorTypeBinder) {
        const ctor = binder.constructorType;
        if (ctor.type === typeName) {
          constructorTypes.push(binder.constructorType);
        }
      }
    }

    return constructorTypes.sort((a, b) => a.index - b.index);
  }

  /**
   * Generate method type for a constructor
   * Form: (Π [args...] (→ [IHs...] (P ctor)))
   */
  private static generateMethodTypeForConstructor(
    ctx: Context,
    ctorType: C.ConstructorType,
    motiveValue: V.Value,
    typeParams: V.Value[]
  ): V.Value {
    // Build environment with type parameters bound for evaluating argTypes
    let argEnv = new Map(contextToEnvironment(ctx));

    // Extract all VarNames from argTypes and rec_argTypes
    const varNames = new Set<string>();
    [...ctorType.argTypes, ...ctorType.rec_argTypes].forEach(at => {
      if (at instanceof C.VarName) {
        varNames.add(at.name);
      }
    });

    // Bind each unique VarName to the corresponding type parameter
    // Assumption: type parameters appear in order, and VarNames reference them by position
    const varNameArray = Array.from(varNames);
    for (let i = 0; i < varNameArray.length && i < typeParams.length; i++) {
      argEnv.set(varNameArray[i], typeParams[i]);
    }

    // Build the result type: motive applied to constructor application
    const allArgTypes = [
      ...ctorType.argTypes.map(t => t.valOf(argEnv)),
      ...ctorType.rec_argTypes.map(t => t.valOf(argEnv))
    ];

    const buildMethod = (level: number, capturedArgs: V.Value[]): V.Value => {
          if (level >= allArgTypes.length) {
            // All arguments captured, now add inductive hypotheses and result
    
            // Step 1: Add IHs for recursive arguments (in reverse order)
            let result: V.Value;
    
            // First, build the result type: P applied to constructor
            const ctorApp = new V.Constructor(
              ctorType.name,
              ctorType.type,
              capturedArgs,
              ctorType.index,
              []  // Will be filled with recursive args
            );
    
            // Extract result indices from ctorType.resultType
            const resultType = valInContext(ctx, ctorType.resultType);
            const resultIndices = extractIndicesFromValue(resultType);
    
            // Apply motive to indices and constructor
            result = motiveValue;
            for (const idx of resultIndices) {
              result = doApp(result, idx);
            }
            result = doApp(result, ctorApp);
    
            // Step 2: Wrap with inductive hypotheses (for recursive args, in reverse)
            const numNonRec = ctorType.argTypes.length;
            for (let i = ctorType.rec_argTypes.length - 1; i >= 0; i--) {
              const recArgIndex = numNonRec + i;
              const recArg = capturedArgs[recArgIndex];
              const recArgTypeValue = allArgTypes[recArgIndex];

              // Build IH type: P(indices... recArg)
              // The recursive arg type (e.g., Vec E k) when evaluated in context
              // has its indices as Values that reference captured arguments
              let ihType = motiveValue;
              if (recArgTypeValue instanceof V.InductiveTypeConstructor) {
                for (const idx of recArgTypeValue.indices) {
                  ihType = doApp(ihType, idx);
                }
              }
              ihType = doApp(ihType, recArg);

              const currentResult = result;
              result = new V.Pi(
                `ih${i}`,
                ihType,
                new HigherOrderClosure(_ => currentResult)
              );
            }
    
            return result;
          }
    
          // Recursive case: bind constructor argument
          const argType = allArgTypes[level];
          return new V.Pi(
            `arg${level}`,
            argType,
            new HigherOrderClosure(argVal =>
              buildMethod(level + 1, [...capturedArgs, argVal])
            )
          );
        };
    return buildMethod(0, []);
  }
}

function extractIndicesFromValue(val: V.Value): V.Value[] {
  if (val instanceof V.InductiveTypeConstructor) {
    return val.indices;
  }
  return [];
}
