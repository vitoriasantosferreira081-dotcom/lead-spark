
-- Departamentos
CREATE TABLE public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  receive_leads BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pipelines customizáveis
CREATE TABLE public.pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Etapas de cada pipeline
CREATE TABLE public.pipeline_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  position INT NOT NULL,
  color TEXT DEFAULT '#6366F1',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Automações por etapa do pipeline
CREATE TABLE public.pipeline_automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trigger TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Templates de mensagem
CREATE TABLE public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  channel TEXT DEFAULT 'whatsapp',
  category TEXT,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cadências
CREATE TABLE public.cadences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID REFERENCES public.pipeline_stages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  steps JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Perguntas de lead score
CREATE TABLE public.lead_score_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  type TEXT DEFAULT 'select',
  options JSONB DEFAULT '[]',
  weight INT DEFAULT 10,
  position INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Respostas de lead score
CREATE TABLE public.lead_score_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.lead_score_questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answer TEXT,
  score_contribution INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agentes de IA
CREATE TABLE public.ai_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  channel TEXT DEFAULT 'whatsapp',
  provider TEXT DEFAULT 'openai',
  model TEXT DEFAULT 'gpt-4o-mini',
  system_prompt TEXT,
  training_data TEXT,
  can_move_leads BOOLEAN DEFAULT true,
  can_score_leads BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  coexistence_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Provedores WhatsApp
CREATE TABLE public.whatsapp_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'custom',
  webhook_url TEXT,
  api_key TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Novas colunas em leads
ALTER TABLE public.leads 
  ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES public.pipelines(id),
  ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES public.pipeline_stages(id),
  ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id),
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_agent_id UUID REFERENCES public.ai_agents(id),
  ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_human_mode BOOLEAN DEFAULT false;

-- RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_score_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_score_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own" ON public.departments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own" ON public.pipelines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own" ON public.pipeline_stages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own" ON public.pipeline_automations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own" ON public.templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own" ON public.cadences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own" ON public.lead_score_questions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own" ON public.lead_score_answers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own" ON public.ai_agents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_own" ON public.whatsapp_providers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipeline_stages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_agents;
