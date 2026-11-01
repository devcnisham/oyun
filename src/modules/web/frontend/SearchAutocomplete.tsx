'use client';

import { useId, useRef, useState } from 'react';
import SearchSuggestions, { useSuggestions } from './SearchSuggestions';
import styles from './SearchAutocomplete.module.css';

export default function SearchAutocomplete({ value, onChange, label, name, placeholder, inputRef }: {
  value:string; onChange:(value:string)=>void; label:string; name?:string; placeholder?:string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [open,setOpen]=useState(false);
  const id=useId();
  const root=useRef<HTMLDivElement>(null);
  const suggestions=useSuggestions(value,open);
  const visible=open && Boolean(value.trim());
  const lastWord=value.match(/[^\s]+$/)?.[0] ?? '';
  const word=lastWord ? suggestions.flatMap(item=>item.label.split(/\s+/)).find(candidate=>candidate.toLowerCase().startsWith(lastWord.toLowerCase()) && candidate.length>lastWord.length) : undefined;
  const completion=word ? value+word.slice(lastWord.length) : '';

  return <div ref={root} className={styles.control} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}} onKeyDown={event=>{
    if((event.key==='Tab'||event.key==='ArrowRight') && completion && event.target instanceof HTMLInputElement && event.target.selectionStart===value.length && event.target.selectionEnd===value.length){event.preventDefault();onChange(completion);return;}
    if(event.key==='Escape'){root.current?.querySelector('input')?.focus();setOpen(false);}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      if(!visible)return;
      const links=Array.from(root.current?.querySelectorAll<HTMLAnchorElement>('ul a')??[]);
      if(!links.length)return;
      event.preventDefault();
      const current=links.indexOf(document.activeElement as HTMLAnchorElement);
      const index=event.key==='ArrowDown'?(current+1)%links.length:(current<=0?links.length-1:current-1);
      links[index]?.focus();
    }
  }}>
    {visible && completion && <span className={styles.ghost} aria-hidden="true"><span>{value}</span>{completion.slice(value.length)}</span>}
    <input ref={inputRef} name={name} type="search" value={value} onChange={event=>{onChange(event.target.value);setOpen(true);}} onFocus={()=>setOpen(true)} aria-label={label} aria-controls={visible?id:undefined} placeholder={placeholder} autoComplete="off" enterKeyHint="search" />
    {visible&&<div id={id} className={styles.dropdown}><SearchSuggestions query={value} suggestions={suggestions} onPick={()=>setOpen(false)} /></div>}
  </div>;
}
