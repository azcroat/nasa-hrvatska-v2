// Cryptographically-seeded random number in [0,1) — drop-in for Math.random()
export function rnd(){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296;}
