import { timingSafeEqual } from 'node:crypto';

export function validAdminToken(given: string | null): boolean {
 const expected = process.env.APP_ADMIN_TOKEN;
 if (!expected || expected.length < 24 || !given) return false;
 const a=Buffer.from(given); const b=Buffer.from(expected);
 return a.length === b.length && timingSafeEqual(a,b);
}
export function inBusinessHours(now: Date, zone: string, hours: string): boolean {
 const match=/^(\d\d):(\d\d)-(\d\d):(\d\d)$/.exec(hours);
 if (!match) return false;
 const value=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
 const current=Number(value.slice(0,2))*60+Number(value.slice(3,5));
 return current>=Number(match[1])*60+Number(match[2]) && current<=Number(match[3])*60+Number(match[4]);
}
