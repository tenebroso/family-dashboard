import { useEffect } from 'react'

export function usePageMeta(title: string, iconHref: string, manifestHref: string) {
  useEffect(() => {
    document.title = title

    const touchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
    if (touchIcon) touchIcon.href = iconHref

    const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    if (manifest) manifest.href = manifestHref
  }, [title, iconHref, manifestHref])
}
