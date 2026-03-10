function n(t){const i=t.lastIndexOf("/");return i===-1?{parent:null,leaf:t}:{parent:t.slice(0,i),leaf:t.slice(i+1)}}function e(t){return t.title?t.title:(t.content.split(`
`)[0]?.trim()??"").slice(0,72)||"Untitled"}function r(t){return t.title?t.content.split(`
`).slice(0,2).join(" ").trim().slice(0,120):""}function l(t){return t.title?t.content.split(`
`).slice(0,4).join(" ").trim().slice(0,200):t.content.split(`
`).slice(1).join(" ").trim().slice(0,180)}export{r as a,l as g,e as p,n as s};
