// Hardened math-expression helpers for the browser.
//
// The pages used to compile user strings with `new Function(...)` directly,
// which is arbitrary code execution (XSS). These helpers run a strict lexical
// gate first — the same strategy as the backend's safe_sympify — and only then
// build a function from the vetted string. The gate rejects ".", "__", unknown
// identifiers, too-long expressions and huge integer literals, so the compiled
// body can only reference the allowed math functions/constants/variables.

const MAX_EXPRESSION_LENGTH = 200
const MAX_INTEGER_DIGITS = 6

const ALLOWED_FUNCTIONS = new Set<string>([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
  'exp', 'log', 'ln', 'sqrt', 'abs', 'sen',
  'sinh', 'cosh', 'tanh', 'floor', 'ceil', 'sign',
])

const CONSTANTS = new Set<string>(['pi', 'e'])
const LOGIC = new Set<string>(['and', 'or', 'not'])
const PUNCTUATION = new Set<string>('()+-,*/%<>!=:'.split(''))

const IDENTIFIER_RE = /[^\W\d_]\w*/uy
const NUMBER_RE = /(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/uy

function checkLexical(expr: string, allowedVars: readonly string[]): void {
  if (!expr.trim()) throw new Error('Expression cannot be empty')
  if (expr.length > MAX_EXPRESSION_LENGTH) {
    throw new Error(`Expression too long (${expr.length} chars, max ${MAX_EXPRESSION_LENGTH})`)
  }
  const allowed = new Set<string>([...allowedVars, ...ALLOWED_FUNCTIONS, ...CONSTANTS, ...LOGIC])

  let i = 0
  const n = expr.length
  while (i < n) {
    const ch = expr[i]
    if (/\s/.test(ch)) {
      i += 1
      continue
    }
    NUMBER_RE.lastIndex = i
    const num = NUMBER_RE.exec(expr)
    if (num) {
      const intPart = num[0].split('.')[0].split(/[eE]/)[0].replace(/^[+-]/, '')
      if (intPart.length > MAX_INTEGER_DIGITS) {
        throw new Error(`Integer literal too large (${intPart.length} digits)`)
      }
      i = NUMBER_RE.lastIndex
      continue
    }
    IDENTIFIER_RE.lastIndex = i
    const id = IDENTIFIER_RE.exec(expr)
    if (id) {
      if (!allowed.has(id[0])) throw new Error(`Unknown or forbidden token: ${id[0]}`)
      i = IDENTIFIER_RE.lastIndex
      continue
    }
    if (PUNCTUATION.has(ch)) {
      i += 1
      continue
    }
    if (ch === '.') throw new Error('Attribute access is not allowed')
    if (ch === '_') throw new Error('Underscore identifiers are not allowed')
    throw new Error(`Invalid character: ${ch}`)
  }
}

/** Normalize the power operator only (^ -> **) before the lexical gate. */
function normalizePower(expr: string): string {
  return expr.replace(/\^/g, '**')
}

/** Parse a constant numeric expression (e.g. "pi/4", "1/3", "10^-1"). Returns NaN on invalid input. */
export function parseMathExpr(expr: string): number {
  if (!expr || expr.trim() === '') return NaN
  try {
    const normalized = normalizePower(expr)
    checkLexical(normalized.toLowerCase(), [])
    const js = normalized
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\be\b/gi, 'Math.E')
    // eslint-disable-next-line no-new-func
    return Number(new Function(`return ${js}`)())
  } catch {
    return NaN
  }
}

/** Compile a single-variable expression into a numeric function of x. Throws on invalid input. */
export function compileMathFunc(funcStr: string): (x: number) => number {
  const normalized = normalizePower(funcStr).toLowerCase()
  checkLexical(normalized, ['x'])
  const jsFuncStr = normalized
    .replace(/sen\(/g, 'sin(')
    .replace(/ln\(/g, 'log(')
    .replace(/-([a-zA-Z0-9_.]+)\*\*(\d+)/g, '-($1**$2)')
    .replace(/\b(sin|cos|tan|asin|acos|atan|exp|log|sqrt|abs)\(/g, 'Math.$1(')
    .replace(/\bpi\b/g, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
  // eslint-disable-next-line no-new-func
  return new Function('x', `return ${jsFuncStr}`) as (x: number) => number
}
