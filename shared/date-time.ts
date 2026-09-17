/** datetime-local expects wall-clock time, never an ISO UTC substring. */
export function localDateTime(iso:string|null){
 if(!iso)return '';
 const date=new Date(iso);
 if(!Number.isFinite(date.getTime()))return '';
 const pad=(n:number)=>String(n).padStart(2,'0');
 return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
