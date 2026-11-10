import { useThemeStore } from './theme-store';

describe('Theme Store', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({
      theme: 'dark',
      adminTheme: 'light',
    });
  });

  it('should default the admin panel to the light theme', () => {
    const { theme, adminTheme } = useThemeStore.getState();

    expect(theme).toBe('dark');
    expect(adminTheme).toBe('light');
  });

  it('should keep the site theme and the admin theme independent', () => {
    useThemeStore.getState().setAdminTheme('dark');

    expect(useThemeStore.getState().adminTheme).toBe('dark');
    expect(useThemeStore.getState().theme).toBe('dark');

    useThemeStore.getState().setTheme('light');

    expect(useThemeStore.getState().theme).toBe('light');
    expect(useThemeStore.getState().adminTheme).toBe('dark');
  });

  it('should not affect the site theme when the admin theme changes', () => {
    useThemeStore.getState().setTheme('light');
    useThemeStore.getState().setAdminTheme('dark');

    expect(useThemeStore.getState().theme).toBe('light');
    expect(useThemeStore.getState().adminTheme).toBe('dark');
  });
});
