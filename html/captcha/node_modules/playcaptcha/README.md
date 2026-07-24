# playcaptcha

A captcha that's a claw machine.

It asks for a toy. You drive the claw with the joystick (or arrow keys), hit the red button, the claw dives down and grabs whatever's under it. Carry the catch over the hatch and drop it in. Right toy and you're verified, wrong toy bounces off the lid and goes back on the pile.

No physics engine behind it, just damped springs and scripted phases in one rAF loop. React state only changes when the phase changes, the rest is transforms written through refs, so it stays smooth even on weak devices.

Obvious but worth saying: this checks that someone is *playing*, not who they are. Keep it in front of your real checks, don't replace them with it.

This is part of [FeralUI](https://github.com/mortspace/feralui).

## setup

```bash
npm install playcaptcha
```

Then copy the `assets/` folder into whatever your app serves statically. The component looks for the toy renders under `/toys/` and the logo at `/playcaptcha.svg` by default, `assetBase` moves that.

```tsx
import { ClawCaptcha } from 'playcaptcha'
import 'playcaptcha/clawcaptcha.css'

<ClawCaptcha onVerify={() => unlock()} />
```

Leave `target` off and every mount asks for a different random toy. Or pin one:

```tsx
<ClawCaptcha target="duck" onVerify={() => unlock()} />
```

The 12 toy ids: duck, bear, panda, bunny, dino, penguin, fox, frog, whale, cat, puppy, unicorn.

Other props: `title` (the heading), `assetBase`, `className`. That's all of them.

## theming

CSS vars on any ancestor:

```css
:root {
  --clawcap-bg: #ffffff;     /* card */
  --clawcap-ink: #1c1c1e;    /* text */
  --clawcap-muted: #8a8a8e;
  --clawcap-accent: #1c1c1e; /* dialog button + focus ring */
  --clawcap-action: #ff5159; /* the big red button */
}
```

Keyboard runs the whole thing (arrows + space/enter), the joystick is a real slider role, and prefers-reduced-motion swaps the decorative stuff (entrance tumble, confetti, ring pulse) for instant state changes.

MIT. Toy renders live in assets/toys.
