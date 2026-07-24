import * as react from 'react';

type ToyId = 'duck' | 'bear' | 'panda' | 'bunny' | 'dino' | 'penguin' | 'fox' | 'frog' | 'whale' | 'cat' | 'puppy' | 'unicorn';
declare const TOY_META: Record<ToyId, {
    label: string;
    accent: string;
}>;

interface ClawCaptchaProps {
    /** Which toy the challenge asks for. A random toy each mount when omitted. */
    target?: ToyId;
    /** Fired once when the right toy lands in the tray. */
    onVerify?: () => void;
    /** Heading shown above the machine. */
    title?: string;
    /** Where the toy PNGs are served from. */
    assetBase?: string;
    className?: string;
}
declare function ClawCaptcha({ target: targetProp, onVerify, title, assetBase, className, }: ClawCaptchaProps): react.JSX.Element;

export { ClawCaptcha, type ClawCaptchaProps, TOY_META, type ToyId };
