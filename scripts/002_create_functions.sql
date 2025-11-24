-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
    COALESCE(new.raw_user_meta_data ->> 'role', 'teacher')
  );
  RETURN new;
END;
$$;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to log grade updates
CREATE OR REPLACE FUNCTION public.log_grade_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN 'created'
         WHEN TG_OP = 'UPDATE' THEN 'updated'
         WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    'grade',
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for grade audit logging
DROP TRIGGER IF EXISTS on_grade_change ON public.grades;
CREATE TRIGGER on_grade_change
  AFTER INSERT OR UPDATE OR DELETE ON public.grades
  FOR EACH ROW
  EXECUTE FUNCTION public.log_grade_update();

-- Function to insert initial grade record when student is added to class
CREATE OR REPLACE FUNCTION public.create_grade_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For each subject taught in the student's class, create a grade record
  INSERT INTO public.grades (student_id, class_id, teacher_id, subject)
  SELECT NEW.id, ca.class_id, ca.teacher_id, ca.subject
  FROM public.class_assignments ca
  WHERE ca.class_id = NEW.class_id
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create grade records
DROP TRIGGER IF EXISTS on_student_added ON public.students;
CREATE TRIGGER on_student_added
  AFTER INSERT ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.create_grade_record();
