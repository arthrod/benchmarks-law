const details = document.getElementById("toc-details") as HTMLDetailsElement | null;
const aside = document.querySelector(".lr-aside");
type D = typeof details;
type A = typeof aside;
declare const d: D; declare const a: A;
// force the compiler to print the resolved types
const x: number = d as unknown as number;
const y: number = a as unknown as number;
