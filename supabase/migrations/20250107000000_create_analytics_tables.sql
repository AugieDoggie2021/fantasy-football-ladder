-- Add analytics consent columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS analytics_consent BOOLEAN,
ADD COLUMN IF NOT EXISTS analytics_consent_at TIMESTAMPTZ;

-- Analytics Events Table
-- Stores custom analytics events for tracking user behavior and league metrics
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_league_id ON public.analytics_events(league_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_team_id ON public.analytics_events(team_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_created ON public.analytics_events(user_id, created_at);

-- Analytics League Metrics Table
-- Stores aggregated league engagement and health metrics
CREATE TABLE IF NOT EXISTS public.analytics_league_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  daily_active_managers INTEGER DEFAULT 0,
  weekly_active_managers INTEGER DEFAULT 0,
  lineup_changes_count INTEGER DEFAULT 0,
  draft_completion_time_minutes INTEGER,
  invite_acceptance_rate DECIMAL(5, 2),
  team_participation_rate DECIMAL(5, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(league_id, metric_date)
);

-- Indexes for analytics_league_metrics
CREATE INDEX IF NOT EXISTS idx_analytics_league_metrics_league_id ON public.analytics_league_metrics(league_id);
CREATE INDEX IF NOT EXISTS idx_analytics_league_metrics_metric_date ON public.analytics_league_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_analytics_league_metrics_league_date ON public.analytics_league_metrics(league_id, metric_date);

-- Analytics User Sessions Table
-- Tracks user sessions for engagement analysis
CREATE TABLE IF NOT EXISTS public.analytics_user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  page_views_count INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET
);

-- Indexes for analytics_user_sessions
CREATE INDEX IF NOT EXISTS idx_analytics_user_sessions_user_id ON public.analytics_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_sessions_session_id ON public.analytics_user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_sessions_started_at ON public.analytics_user_sessions(started_at);

-- RLS Policies for analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own events
CREATE POLICY "Users can view their own analytics events"
  ON public.analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- League commissioners can view events for their leagues
CREATE POLICY "Commissioners can view league analytics events"
  ON public.analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = analytics_events.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Admins can view all events
CREATE POLICY "Admins can view all analytics events"
  ON public.analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Authenticated users can insert their own events
CREATE POLICY "Authenticated users can insert analytics events"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- RLS Policies for analytics_league_metrics
ALTER TABLE public.analytics_league_metrics ENABLE ROW LEVEL SECURITY;

-- League commissioners can view metrics for their leagues
CREATE POLICY "Commissioners can view league metrics"
  ON public.analytics_league_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.leagues
      WHERE leagues.id = analytics_league_metrics.league_id
      AND leagues.created_by_user_id = auth.uid()
    )
  );

-- Admins can view all metrics
CREATE POLICY "Admins can view all league metrics"
  ON public.analytics_league_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- RLS Policies for analytics_user_sessions
ALTER TABLE public.analytics_user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON public.analytics_user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all sessions
CREATE POLICY "Admins can view all user sessions"
  ON public.analytics_user_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Authenticated users can insert their own sessions
CREATE POLICY "Authenticated users can insert sessions"
  ON public.analytics_user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

