GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated;