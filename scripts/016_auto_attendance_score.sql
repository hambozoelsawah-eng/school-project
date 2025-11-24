-- إنشاء دالة لحساب درجة المواظبة تلقائياً بناءً على نسبة الحضور
CREATE OR REPLACE FUNCTION calculate_attendance_score_for_student(
  p_student_id UUID,
  p_class_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS NUMERIC AS $$
DECLARE
  v_total_days INTEGER;
  v_present_days INTEGER;
  v_attendance_percentage NUMERIC;
  v_attendance_score NUMERIC;
BEGIN
  -- حساب إجمالي الأيام
  SELECT COUNT(DISTINCT attendance_date)
  INTO v_total_days
  FROM attendance
  WHERE class_id = p_class_id
    AND attendance_date BETWEEN p_start_date AND p_end_date;

  -- إذا لم تكن هناك سجلات حضور، إرجاع 0
  IF v_total_days = 0 THEN
    RETURN 0;
  END IF;

  -- حساب أيام الحضور
  SELECT COUNT(*)
  INTO v_present_days
  FROM attendance
  WHERE student_id = p_student_id
    AND class_id = p_class_id
    AND status = 'present'
    AND attendance_date BETWEEN p_start_date AND p_end_date;

  -- حساب نسبة الحضور
  v_attendance_percentage := (v_present_days::NUMERIC / v_total_days::NUMERIC) * 100;

  -- تحويل النسبة إلى درجة من 5
  IF v_attendance_percentage >= 90 THEN
    v_attendance_score := 5;
  ELSIF v_attendance_percentage >= 80 THEN
    v_attendance_score := 4;
  ELSIF v_attendance_percentage >= 70 THEN
    v_attendance_score := 3;
  ELSIF v_attendance_percentage >= 60 THEN
    v_attendance_score := 2;
  ELSE
    v_attendance_score := 0;
  END IF;

  RETURN v_attendance_score;
END;
$$ LANGUAGE plpgsql;

-- إنشاء دالة لتحديث درجات المواظبة لجميع طلاب فصل معين
CREATE OR REPLACE FUNCTION update_attendance_scores_for_class(
  p_class_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
) RETURNS TABLE(student_id UUID, attendance_score NUMERIC, updated_count INTEGER) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_student RECORD;
  v_score NUMERIC;
  v_updated_count INTEGER := 0;
BEGIN
  -- إذا لم يتم تحديد التواريخ، استخدم الشهر الحالي
  v_start_date := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE)::DATE);
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  -- المرور على جميع الطلاب في الفصل
  FOR v_student IN 
    SELECT DISTINCT s.id
    FROM students s
    WHERE s.class_id = p_class_id
  LOOP
    -- حساب درجة المواظبة للطالب
    v_score := calculate_attendance_score_for_student(
      v_student.id,
      p_class_id,
      v_start_date,
      v_end_date
    );

    -- تحديث درجة المواظبة في جدول grades لجميع المواد
    UPDATE grades
    SET 
      attendance = v_score,
      updated_at = NOW()
    WHERE grades.student_id = v_student.id
      AND grades.class_id = p_class_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    -- إرجاع النتيجة
    RETURN QUERY SELECT v_student.id, v_score, v_updated_count;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- إضافة تعليق توضيحي
COMMENT ON FUNCTION calculate_attendance_score_for_student IS 'تحسب درجة المواظبة (من 5) بناءً على نسبة الحضور';
COMMENT ON FUNCTION update_attendance_scores_for_class IS 'تحدث درجات المواظبة لجميع طلاب الفصل تلقائياً';
