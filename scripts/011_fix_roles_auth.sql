-- تصحيح نظام الأدوار والمصادقة
-- تأكيد أن البيانات متطابقة بين Auth و Profiles

-- حذف أي سجلات في profiles بدون auth user
DELETE FROM profiles 
WHERE id NOT IN (
  SELECT id FROM auth.users
);

-- تحديث جميع المستخدمين الذين ليس لديهم دور محدد
UPDATE profiles 
SET role = 'teacher' 
WHERE role IS NULL OR role = '';

-- تأكيد أن admin@gamal.com فقط له دور admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@gamal.com';

UPDATE profiles 
SET role = 'teacher' 
WHERE email != 'admin@gamal.com' AND role NOT IN ('admin', 'teacher');

-- إنشاء trigger لتحديث is_active عند التسجيل والحذف
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, is_active)
  VALUES (NEW.id, NEW.email, 'teacher', true)
  ON CONFLICT (id) DO UPDATE SET is_active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_created();

-- إنشاء trigger لتعطيل المستخدم عند الحذف
CREATE OR REPLACE FUNCTION public.handle_auth_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET is_active = false 
  WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_deleted();
