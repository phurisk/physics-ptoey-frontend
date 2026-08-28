// Client-side grading for TYPED flashcards — the server trusts whatever
// grade the client computed and never re-derives it, but the student can
// still adjust the suggested grade (harder/easier) before confirming.

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

export type TypedCheckResult = { grade: number; kind: "ok" | "near" | "no" }

export function checkTypedAnswer(userAnswer: string, acceptedAnswers: string[], numericTolerance: number | null): TypedCheckResult {
  const given = normalize(userAnswer)
  if (!given) return { grade: 0, kind: "no" }

  for (const accepted of acceptedAnswers) {
    if (normalize(accepted) === given) return { grade: 4, kind: "ok" }
  }

  if (numericTolerance != null) {
    const givenNum = Number(given)
    if (Number.isFinite(givenNum)) {
      for (const accepted of acceptedAnswers) {
        const acceptedNum = Number(accepted)
        if (Number.isFinite(acceptedNum) && Math.abs(givenNum - acceptedNum) <= numericTolerance) {
          return { grade: 4, kind: "ok" }
        }
      }
    }
  }

  for (const accepted of acceptedAnswers) {
    if (levenshtein(given, normalize(accepted)) <= 2) return { grade: 3, kind: "near" }
  }

  return { grade: 0, kind: "no" }
}
