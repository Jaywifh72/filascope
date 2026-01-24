-- =====================================================
-- USER-GENERATED CONTENT TABLES
-- =====================================================

-- 1. Product Reviews Table (extends existing ratings with full reviews)
CREATE TABLE public.filament_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  would_recommend BOOLEAN,
  printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
  verified_purchase BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'flagged', 'removed')),
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(filament_id, user_id)
);

-- Review helpful votes
CREATE TABLE public.review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.filament_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- 2. Print Results / User Photos
CREATE TABLE public.print_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  printer_id UUID REFERENCES public.printers(id) ON DELETE SET NULL,
  print_settings JSONB DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'featured', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Print result likes
CREATE TABLE public.print_result_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  print_result_id UUID REFERENCES public.print_results(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(print_result_id, user_id)
);

-- 3. Q&A Section
CREATE TABLE public.product_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filament_id UUID REFERENCES public.filaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  helpful_count INTEGER DEFAULT 0,
  answer_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.product_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.product_questions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT NOT NULL,
  is_brand_verified BOOLEAN DEFAULT false,
  is_accepted BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.answer_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  answer_id UUID REFERENCES public.product_answers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(answer_id, user_id)
);

-- 4. Brand Verification / Representatives
CREATE TABLE public.brand_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.automated_brands(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'representative' CHECK (role IN ('representative', 'admin', 'support')),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(brand_id, user_id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_filament_reviews_filament ON public.filament_reviews(filament_id);
CREATE INDEX idx_filament_reviews_user ON public.filament_reviews(user_id);
CREATE INDEX idx_filament_reviews_rating ON public.filament_reviews(rating);
CREATE INDEX idx_print_results_filament ON public.print_results(filament_id);
CREATE INDEX idx_product_questions_filament ON public.product_questions(filament_id);
CREATE INDEX idx_product_answers_question ON public.product_answers(question_id);
CREATE INDEX idx_brand_representatives_brand ON public.brand_representatives(brand_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.filament_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_result_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answer_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_representatives ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Reviews are publicly readable" ON public.filament_reviews
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can create reviews" ON public.filament_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.filament_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.filament_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Review votes policies
CREATE POLICY "Votes are publicly readable" ON public.review_helpful_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON public.review_helpful_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change own votes" ON public.review_helpful_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove own votes" ON public.review_helpful_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Print results policies
CREATE POLICY "Print results are publicly readable" ON public.print_results
  FOR SELECT USING (status IN ('published', 'featured'));

CREATE POLICY "Users can upload prints" ON public.print_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prints" ON public.print_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prints" ON public.print_results
  FOR DELETE USING (auth.uid() = user_id);

-- Print likes policies
CREATE POLICY "Likes are publicly readable" ON public.print_result_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like" ON public.print_result_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON public.print_result_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Questions policies
CREATE POLICY "Questions are publicly readable" ON public.product_questions
  FOR SELECT USING (true);

CREATE POLICY "Users can ask questions" ON public.product_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions" ON public.product_questions
  FOR UPDATE USING (auth.uid() = user_id);

-- Answers policies
CREATE POLICY "Answers are publicly readable" ON public.product_answers
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can answer" ON public.product_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers" ON public.product_answers
  FOR UPDATE USING (auth.uid() = user_id);

-- Answer votes policies
CREATE POLICY "Answer votes readable" ON public.answer_helpful_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote answers" ON public.answer_helpful_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change answer votes" ON public.answer_helpful_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Brand representatives policies
CREATE POLICY "Verified reps are readable" ON public.brand_representatives
  FOR SELECT USING (status = 'verified');

CREATE POLICY "Users can apply" ON public.brand_representatives
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage reps" ON public.brand_representatives
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));