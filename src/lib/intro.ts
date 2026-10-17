import { useSyncExternalStore } from "react"

// Кіріспе экран біткенін бүкіл сайтқа хабарлайтын шағын «дүкен».
let done = false
const listeners = new Set<() => void>()

export function finishIntro() {
  if (done) return
  done = true
  listeners.forEach((l) => l())
}

export function useIntroDone() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => done,
  )
}
