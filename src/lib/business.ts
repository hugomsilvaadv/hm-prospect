import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  ownerName: z.string().min(1),
  ownerRole: z.string().min(1),
  companyName: z.string().min(1),
  companyWebsite: z.string().min(1),
  instagramHandle: z.string().min(1),
  whatsappLink: z.string().min(1),
  affiliateGroupLink: z.string().default(''),
  oneLinePitch: z.string().min(1),
  howItWorks: z.array(z.string()),
  revenueModel: z.string(),
  marketJargon: z.record(z.string(), z.string()),
  verifiedClaims: z.array(z.string()),
  unverifiedClaims: z.array(z.string()),
  icpSegments: z.array(z.string()),
  icpKeywords: z.array(z.string()),
  affiliateTopics: z.array(z.string()),
  geography: z.array(z.string()),
});
export type Business = z.infer<typeof schema>;

export function getBusiness(): Business {
  const file = path.resolve(process.cwd(), 'config/business.json');
  if (!fs.existsSync(file)) throw new Error('CONFIG_MISSING: copie config/business.example.json para config/business.json e configure.');
  const business = schema.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
  if (Object.values(business).some(v => typeof v === 'string' && v.includes('{{'))) {
    throw new Error('CONFIG_INCOMPLETE: preencha todos os campos obrigatórios em config/business.json.');
  }
  return business;
}


/** CRM prospect qualification can work before website, WhatsApp and API keys exist. */
export function getIcpConfig():Pick<Business,'icpSegments'|'icpKeywords'|'geography'> {
 const preferred=path.resolve(process.cwd(),'config/business.json');
 const sample=path.resolve(process.cwd(),'config/business.example.json');
 const file=fs.existsSync(preferred)?preferred:sample;
 const content=JSON.parse(fs.readFileSync(file,'utf8')) as unknown;
 return schema.pick({icpSegments:true,icpKeywords:true,geography:true}).parse(content);
}
