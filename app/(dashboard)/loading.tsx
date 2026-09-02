import { appTranslations } from '@/src/translations/pl/app';

export default function DashboardLoading() {
    return (
        <main
            className='route-loading'
            id='main-content'
            aria-label={appTranslations.loading.page}
            aria-busy='true'
        >
            <div className='loading-topbar'>
                <span />
                <span />
            </div>
            <div className='loading-hero'>
                <span />
                <span />
                <span />
            </div>
            <div className='loading-card' />
            <div className='loading-card short' />
        </main>
    );
}
