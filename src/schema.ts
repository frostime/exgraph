import { z } from 'zod';

export const nodeStateSchema = z.enum([
  'seed',
  'candidate',
  'active',
  'blocked',
  'done',
  'closed',
  'archived',
]);

export const viewNameSchema = z.enum(['flow', 'cluster', 'frontier']);

const extraSchema = z.record(z.unknown());

export const nodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.string().min(1).optional(),
  state: nodeStateSchema.optional(),
  note: z.string().optional(),
  state_note: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
  extra: extraSchema.optional(),
}).strict();

export const edgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  kind: z.string().min(1).optional(),
  label: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
  extra: extraSchema.optional(),
}).strict();

export const renderConfigSchema = z.object({
  default_view: viewNameSchema.optional(),
  views: z.array(viewNameSchema).optional(),
}).strict();

export const exGraphSchema = z.object({
  version: z.union([z.string(), z.number()]),
  title: z.string().min(1),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema).optional(),
  sets: z.record(z.array(z.string().min(1))).optional(),
  render: renderConfigSchema.optional(),
  extra: extraSchema.optional(),
}).strict();

export type ExGraphInput = z.infer<typeof exGraphSchema>;
