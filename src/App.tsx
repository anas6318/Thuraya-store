import {lazy,Suspense,useEffect} from 'react';
import {Routes,Route,Navigate,useLocation} from 'react-router-dom';
import {StoreProvider,useStore} from './store';
import {Layout} from './components/Layout';
import {Home,Shop,ProductPage} from './pages/Storefront';
import {CartPage,Checkout,Confirmation,Tracking} from './pages/Commerce';
import {Account,Concierge,Content,ReviewForm} from './pages/Customer';
import {Empty} from './components/ui';
import {t} from './i18n';
import type {Catalog} from '../shared/domain';
const Admin=lazy(()=>import('./pages/Admin'));
export function App({initial}:{initial?:Catalog}){return <StoreProvider initial={initial}><Application/></StoreProvider>}
function Application(){const {locale,data,error}=useStore();const location=useLocation();const admin=location.pathname.startsWith('/admin');useEffect(()=>{if(admin)return;const path=location.pathname.replace(/^\/(ar|he|en)/,'');const p=data.products.find(p=>path===`/product/${p.slug}`);document.title=`${p?.seoTitle[locale]||t(locale,path===''?'hero':path==='/shop'?'shop':path==='/checkout'?'checkout':path==='/track'?'track':'discover')} · THURAYA`;},[location.pathname,locale,data.products,admin]);if(admin)return <Suspense fallback={<p>Loading admin…</p>}><Admin/></Suspense>;if(data.settings.maintenance)return <Layout><Empty title={t(locale,'maintenance')} body={t(locale,'maintenanceBody')}/></Layout>;return <Layout>{error&&<p role="alert" className="error-box">{t(locale,'error')}</p>}<Routes><Route path="/" element={<Navigate to="/en" replace/>}/>{['ar','he','en'].map(l=><Route key={l} path={`/${l}`}><Route index element={<Home/>}/><Route path="shop" element={<Shop/>}/><Route path="collection/:slug" element={<Shop/>}/><Route path="wishlist" element={<Shop/>}/><Route path="product/:slug" element={<ProductPage/>}/><Route path="cart" element={<CartPage/>}/><Route path="checkout" element={<Checkout/>}/><Route path="order/:number" element={<Confirmation/>}/><Route path="track" element={<Tracking/>}/><Route path="account/*" element={<Account/>}/><Route path="concierge" element={<Concierge/>}/><Route path="review" element={<ReviewForm/>}/><Route path="about" element={<Content/>}/><Route path="faq" element={<Content/>}/><Route path="journal" element={<Content/>}/><Route path="journal/:slug" element={<Content/>}/><Route path="policies/:slug" element={<Content/>}/><Route path="*" element={<Empty title={t(locale,'notFound')}/>}/></Route>)}<Route path="*" element={<Empty title={t(locale,'notFound')}/>}/></Routes></Layout>}
