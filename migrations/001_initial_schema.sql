-- Remix Database Migration 001: Initial Schema
-- PostgreSQL / Supabase Schema with Row Level Security (RLS)

-- 1. Profiles Table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Reference Analyses Table
CREATE TABLE IF NOT EXISTS public.reference_analyses (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  normalized_url TEXT NOT NULL,
  design_specification JSONB NOT NULL,
  desktop_screenshot_path TEXT,
  mobile_screenshot_path TEXT,
  analysis_status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  reference_url TEXT,
  reference_analysis_id TEXT REFERENCES public.reference_analyses(id) ON DELETE SET NULL,
  current_version_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Project Versions Table
CREATE TABLE IF NOT EXISTS public.project_versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  website_definition JSONB NOT NULL,
  generation_configuration JSONB,
  edit_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Add foreign key constraint for current_version_id in projects
ALTER TABLE public.projects 
  DROP CONSTRAINT IF EXISTS fk_current_version;
ALTER TABLE public.projects 
  ADD CONSTRAINT fk_current_version 
  FOREIGN KEY (current_version_id) 
  REFERENCES public.project_versions(id) 
  ON DELETE SET NULL;

-- 5. Saved Websites (Bookmarks from Library)
CREATE TABLE IF NOT EXISTS public.saved_websites (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  website_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_saved_website UNIQUE (user_id, website_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON public.project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_version_number ON public.project_versions(project_id, version_number);
CREATE INDEX IF NOT EXISTS idx_reference_analyses_user_id ON public.reference_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_reference_analyses_normalized_url ON public.reference_analyses(normalized_url);
CREATE INDEX IF NOT EXISTS idx_saved_websites_user_id ON public.saved_websites(user_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_websites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for Projects
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Project Versions
CREATE POLICY "Users can view versions of their own projects"
  ON public.project_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE public.projects.id = public.project_versions.project_id
      AND public.projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert versions for their own projects"
  ON public.project_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE public.projects.id = public.project_versions.project_id
      AND public.projects.user_id = auth.uid()
  ));

-- RLS Policies for Reference Analyses
CREATE POLICY "Users can view public or own reference analyses"
  ON public.reference_analyses FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert reference analyses"
  ON public.reference_analyses FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- RLS Policies for Saved Websites
CREATE POLICY "Users can view their own saved websites"
  ON public.saved_websites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save websites for themselves"
  ON public.saved_websites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their saved websites"
  ON public.saved_websites FOR DELETE
  USING (auth.uid() = user_id);
