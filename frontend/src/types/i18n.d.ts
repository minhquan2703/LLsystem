import vi from '../../messages/vi.json';

declare module 'next-intl' {
    interface AppConfig {
        Messages: typeof vi;
    }
}
