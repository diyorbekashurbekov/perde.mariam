// Админ панельден сайтқа өзгеріс сақтау: GitHub API арқылы бір commit жасалады,
// содан кейін GitHub Actions сайтты қайта жинап шығарады (1–2 минут).
// Рұқсат — GitHub-тағы «fine-grained token» (тек осы репозиторий: Contents — Read and write, Actions — Read).
// Токен тек осы құрылғының браузерінде сақталады.

export const OWNER = "diyorbekashurbekov"
export const REPO = "perde.mariam"
export const BRANCH = "main"
const API = `https://api.github.com/repos/${OWNER}/${REPO}`
const TOKEN_KEY = "pm-gh-token"

export const TOKEN_URL =
  "https://github.com/settings/personal-access-tokens/new?name=Perde%20Mariam%20admin&description=Admin%20panel%20content%20editing&expires_in=366"

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ""
  } catch {
    return ""
  }
}
export function setToken(t: string) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export class GhError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function gh<T>(path: string, init: RequestInit = {}, token = getToken()): Promise<T> {
  const r = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  })
  if (!r.ok) {
    const j = await r.json().catch(() => ({}))
    const msg =
      r.status === 401 ? "GitHub кілті (токен) жарамсыз немесе мерзімі өткен."
      : r.status === 403 ? "GitHub кілтіне бұл әрекетке рұқсат жоқ (Contents: Read and write керек)."
      : r.status === 404 ? "Репозиторий табылмады немесе кілтке бұл репозиторийге рұқсат берілмеген."
      : j?.message || `GitHub қатесі (${r.status})`
    throw new GhError(msg, r.status)
  }
  return (r.status === 204 ? null : r.json()) as Promise<T>
}

// Кілтті тексеру: репозиторийге жазу рұқсаты бар ма.
export async function checkToken(token: string): Promise<void> {
  const repo = await gh<{ permissions?: { push?: boolean } }>("", {}, token)
  if (!repo.permissions?.push) throw new GhError("Бұл кілтпен сайтты өзгертуге рұқсат жоқ. Contents — Read and write таңдаңыз.", 403)
}

/* ---------- base64 (UTF-8 мәтін мен бинар файлдар үшін) ---------- */

export function utf8ToBase64(s: string) {
  return bytesToBase64(new TextEncoder().encode(s))
}
function base64ToUtf8(b64: string) {
  const bin = atob(b64.replace(/\s/g, ""))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}
export function bytesToBase64(bytes: Uint8Array) {
  let s = ""
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

/* ---------- Файл оқу ---------- */

export async function readText(path: string): Promise<{ text: string; sha: string }> {
  const j = await gh<{ content: string; sha: string; encoding: string }>(`/contents/${encodeURI(path)}?ref=${BRANCH}`)
  return { text: base64ToUtf8(j.content), sha: j.sha }
}

/* ---------- Бір commit-пен бірнеше файл жазу ---------- */

export type FileChange = { path: string; base64: string }

export async function commitFiles(files: FileChange[], message: string, expect?: { path: string; sha: string }): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = await gh<{ object: { sha: string } }>(`/git/ref/heads/${BRANCH}`)
    const head = ref.object.sha
    // Басқа құрылғыдан өзгеріс жасалған болса, үстінен жазып жібермейміз.
    if (expect) {
      const cur = await gh<{ sha: string }>(`/contents/${encodeURI(expect.path)}?ref=${head}`)
      if (cur.sha !== expect.sha) throw new GhError("Сайт мазмұны басқа құрылғыдан өзгертілген. Бетті жаңартып, қайта көріңіз.", 409)
    }
    const commit = await gh<{ tree: { sha: string } }>(`/git/commits/${head}`)
    const tree = []
    for (const f of files) {
      const blob = await gh<{ sha: string }>("/git/blobs", { method: "POST", body: JSON.stringify({ content: f.base64, encoding: "base64" }) })
      tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha })
    }
    const newTree = await gh<{ sha: string }>("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree }) })
    const newCommit = await gh<{ sha: string }>("/git/commits", {
      method: "POST",
      body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }),
    })
    try {
      await gh(`/git/refs/heads/${BRANCH}`, { method: "PATCH", body: JSON.stringify({ sha: newCommit.sha }) })
      return newCommit.sha
    } catch (e) {
      // Арада басқа commit түсіп кетсе (422 — fast-forward емес), бір рет қайталаймыз.
      if (!(e instanceof GhError) || e.status !== 422 || attempt === 1) throw e
    }
  }
  throw new GhError("Сақтау сәтсіз аяқталды.", 500)
}

/* ---------- Сайттың жаңаруын бақылау ---------- */

export type DeployState = "queued" | "building" | "done" | "failed" | "unknown"
export async function deployState(sha: string): Promise<DeployState> {
  try {
    const j = await gh<{ workflow_runs: { status: string; conclusion: string | null }[] }>(`/actions/runs?head_sha=${sha}&per_page=5`)
    const run = j.workflow_runs[0]
    if (!run) return "queued"
    if (run.status !== "completed") return run.status === "queued" ? "queued" : "building"
    return run.conclusion === "success" ? "done" : "failed"
  } catch {
    return "unknown"
  }
}
