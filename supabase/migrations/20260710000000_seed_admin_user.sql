
-- Seed temporary admin user (email: admin@example.com, password: admin123)
-- Note: In a real environment, you should change this immediately!

-- First, we need to create the user via auth (we'll use a placeholder, but in practice you'd create via Supabase UI or CLI)
-- For this demo, let's create a function to set admin role, and then after creating the user via UI, run this:

-- But since we can't directly insert into auth.users, let's create a helper to promote a user to admin:
CREATE OR REPLACE FUNCTION public.promote_to_admin(_email TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _user_id UUID;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = _email;
  IF _user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'super_admin') ON CONFLICT DO NOTHING;
    RAISE NOTICE 'User % promoted to admin/super_admin', _email;
  ELSE
    RAISE NOTICE 'User % not found', _email;
  END IF;
END;
$$;

-- Now, let's instruct to create the user first via /auth (email: admin@example.com, password: admin123), then run:
-- SELECT public.promote_to_admin('admin@example.com');
