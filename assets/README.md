# assets

Build-time inputs. Not served; nothing here is copied into `out/`.

`Geist-Regular.ttf` renders the OpenGraph card (`scripts/opengraph-card.tsx`). The
card is built under Node, where `next/og` bundles no fallback font, so a font file
has to be supplied or the image comes out blank. `next/font/google` cannot help: it
serves the app's fonts to a browser, it does not hand raw bytes to satori.

Geist is copyright Vercel in collaboration with basement.studio, licensed under the
SIL Open Font License 1.1. The full license is in `Geist-Regular.LICENSE.txt`, kept
alongside the font as the OFL requires.
