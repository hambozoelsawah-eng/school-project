-- دالة لحساب نسبة الحضور ودرجة المواظبة
CREATE OR REPLACE FUNCTION calculate_attendance_score(
  p_student_id UUID,
  p_class_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_max_score NUMERIC DEFAULT 5
) RETURNS NUMERIC AS $$
DECLARE
  v_total_days INTEGER;
  v_present_days INTEGER;
  v_attendance_percentage NUMERIC;
  v_score NUMERIC;
BEGIN
  -- حساب إجمالي الأيام
  SELECT COUNT(*) INTO v_total_days
  FROM attendance
  WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND attendance_date BETWEEN p_start_date AND p_end_date;
  
  -- إذا لم يكن هناك سجلات حضور، إرجاع 0
  IF v_total_days = 0 THEN
    RETURN 0;
  END IF;
  
  -- حساب أيام الحضور
  SELECT COUNT(*) INTO v_present_days
  FROM attendance
  WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND attendance_date BETWEEN p_start_date AND p_end_date
    AND is_present = true;
  
  -- حساب نسبة الحضور
  v_attendance_percentage := (v_present_days::NUMERIC / v_total_days::NUMERIC) * 100;
  
  -- حساب الدرجة بناءً على النسبة
  -- 100% = الدرجة الكاملة
  -- 90% فما فوق = الدرجة الكاملة
  -- 80-89% = 80% من الدرجة
  -- 70-79% = 60% من الدرجة
  -- 60-69% = 40% من الدرجة
  -- أقل من 60% = 0
  
  IF v_attendance_percentage >= 90 THEN
    v_score := p_max_score;
  ELSIF v_attendance_percentage >= 80 THEN
    v_score := p_max_score * 0.8;
  ELSIF v_attendance_percentage >= 70 THEN
    v_score := p_max_score * 0.6;
  ELSIF v_attendance_percentage >= 60 THEN
    v_score := p_max_score * 0.4;
  ELSE
    v_score := 0;
  END IF;
  
  RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث درجات المواظبة لفصل معين
CREATE OR REPLACE FUNCTION update_class_attendance_scores(
  p_class_id UUID,
  p_teacher_id UUID,
  p_subject TEXT,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  attendance_score NUMERIC,
  attendance_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH attendance_stats AS (
    SELECT 
      s.id as student_id,
      s.name as student_name,
      COUNT(*) as total_days,
      COUNT(*) FILTER (WHERE a.is_present = true) as present_days,
      ROUND((COUNT(*) FILTER (WHERE a.is_present = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 1) as percentage
    FROM students s
    LEFT JOIN attendance a ON s.id = a.student_id 
      AND a.class_id = p_class_id
      AND a.attendance_date BETWEEN p_start_date AND p_end_date
    WHERE s.class_id = p_class_id
    GROUP BY s.id, s.name
  )
  SELECT 
    ast.student_id,
    ast.student_name,
    calculate_attendance_score(ast.student_id, p_class_id, p_start_date, p_end_date, 5) as attendance_score,
    ast.percentage as attendance_percentage
  FROM attendance_stats ast;
END;
$$ LANGUAGE plpgsql;
