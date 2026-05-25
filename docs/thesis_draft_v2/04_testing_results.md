# Бүлэг 4. Туршилт, үр дүн

Энэхүү бүлэгт бүрэн цогц системийн (backend API, веб аппликейшн, мобайл аппликейшн) туршилтын үр дүнг тайлбарлана. Туршилт нь 4 үндсэн хэсэгт хуваагдана:

1. **Backend API тест** — Insomnia/Postman ашиглан endpoint-уудыг шалгах.
2. **Unit тест** — Бие даасан функцуудыг Jest-ээр тест хийх.
3. **Integration тест** — Систем хоорондын харилцааг шалгах.
4. **Мобайл аппликейшны тест** — iOS болон Android дээрх ажиллагааг шалгах.

Нэмж: гүйцэтгэлийн (performance), аюулгүй байдлын (security) шалгалтыг 4.4-4.5 хэсэгт авч үзсэн.

## 4.1 Системийн ажиллагааны тест

### 4.1.1 API endpoint тест (Insomnia)

Системийн RESTful API endpoint-уудыг Insomnia хэрэгслийг ашиглан шалгасан. Сервер нь `http://localhost:5000` хаягт ажилладаг бөгөөд бүх хамгаалагдсан endpoint-уудад `Authorization: Bearer <JWT>` толгой мөр шаардагдана. Нэвтрэх үед буцаан өгсөн JWT токеныг дараагийн бүх хүсэлтэд ашигласан.

#### Хэрэглэгчийн API тест (`/api/users`)

| # | Арга | Endpoint | Хүлээгдэж буй | Үр дүн | Тайлбар |
|---|------|----------|---------------|--------|---------|
| 1 | POST | /api/users/register | 201 | 201 | Хэрэглэгч амжилттай бүртгэгдсэн |
| 2 | POST | /api/users/login | 200 + token | 200 + token | JWT токен амжилттай буцсан |
| 3 | GET | /api/users/getuser | 200 | 200 | Токентой хүсэлт амжилттай |
| 4 | GET | /api/users/getuser | 401 | 401 | Токенгүй хүсэлт татгалзагдсан |
| 5 | GET | /api/users/userbalance | 200 | 200 | Дансны үлдэгдэл буцсан |
| 6 | POST | /api/users/send-code | 200 | 200 | Баталгаажуулах код илгээгдсэн |
| 7 | POST | /api/users/verify-email | 200 | 200 | И-мэйл баталгаажсан |
| 8 | POST | /api/users/forgot-password | 200 | 200 | Нууц үг сэргээх и-мэйл илгээгдсэн |
| 9 | PUT | /api/users/photo | 200 | 200 | Профайл зураг шинэчлэгдсэн |
| 10 | GET | /api/users/allusers | 200 | 200 | Зөвхөн админ хандах боломжтой |

**Хүснэгт 4.1.** Хэрэглэгчийн API туршилтын үр дүн.

#### Барааны API тест (`/api/product`)

| # | Арга | Endpoint | Хүлээгдэж буй | Үр дүн | Тайлбар |
|---|------|----------|---------------|--------|---------|
| 1 | GET | /api/product/products | 200 | 200 | Бүх идэвхтэй бараа буцсан |
| 2 | POST | /api/product | 201 | 201 | Шинэ бараа амжилттай нэмэгдсэн |
| 3 | POST | /api/product | 401 | 401 | Токенгүй бол татгалзагдсан |
| 4 | GET | /api/product/my | 200 | 200 | Өөрийн барааны жагсаалт буцсан |
| 5 | GET | /api/product/my/active | 200 | 200 | Идэвхтэй дуудлага худалдаанууд |
| 6 | GET | /api/product/:id | 200 | 200 | Барааны дэлгэрэнгүй мэдээлэл |
| 7 | GET | /api/product/:id | 404 | 404 | Буруу ID бол олдсонгүй хариу |
| 8 | PUT | /api/product/:id | 200 | 200 | Барааны мэдээлэл шинэчлэгдсэн |
| 9 | DELETE | /api/product/:id | 200 | 200 | Бараа амжилттай устгагдсан |
| 10 | POST | /api/product/suggest-category | 200 | 200 | AI ангилал санал болгосон |

**Хүснэгт 4.2.** Барааны API туршилтын үр дүн.

#### Дуудлага худалдааны API тест (`/api/bidding`)

| # | Арга | Endpoint | Хүлээгдэж буй | Үр дүн | Тайлбар |
|---|------|----------|---------------|--------|---------|
| 1 | POST | /api/bidding | 200 | 200 | Үнэ санал амжилттай бүртгэгдсэн |
| 2 | POST | /api/bidding | 400 | 400 | Хангалтгүй дансны үлдэгдэл |
| 3 | GET | /api/bidding/:productId | 200 | 200 | Барааны үнийн түүх буцсан |
| 4 | GET | /api/bidding/my | 200 | 200 | Өөрийн санал болгосон үнүүд |
| 5 | GET | /api/bidding/my-wins | 200 | 200 | Ялсан дуудлагуудын жагсаалт |
| 6 | GET | /api/bidding/my-losses | 200 | 200 | Ялагдсан дуудлагуудын жагсаалт |
| 7 | GET | /api/bidding/check-bid-status/:id | 200 | 200 | Хэрэглэгчийн одоогийн статус |

**Хүснэгт 4.3.** Дуудлага худалдааны API туршилтын үр дүн.

#### Бусад API тест

| # | Арга | Endpoint | Хүлээгдэж буй | Үр дүн | Тайлбар |
|---|------|----------|---------------|--------|---------|
| 1 | GET | /api/category | 200 | 200 | 66 ангилал буцсан |
| 2 | POST | /api/watchlist/:productId | 200 | 200 | Бараа хяналтын жагсаалтад нэмэгдсэн |
| 3 | GET | /api/notifications | 200 | 200 | Мэдэгдлийн жагсаалт буцсан |
| 4 | GET | /api/notifications/unread-count | 200 | 200 | Уншаагүй мэдэгдлийн тоо |
| 5 | POST | /api/reviews | 201 | 201 | Үнэлгээ амжилттай нэмэгдсэн |
| 6 | GET | /api/reviews/product/:id | 200 | 200 | Барааны үнэлгээнүүд буцсан |
| 7 | GET | /api/search | 200 | 200 | Хайлтын үр дүн буцсан |
| 8 | GET | /api/admin | 200 | 200 | Зөвхөн админ статистик харах |

**Хүснэгт 4.4.** Бусад API туршилтын үр дүн.

Нийт **34 API endpoint**-ийг Insomnia хэрэгслээр шалгасан бөгөөд бүгд хүлээгдэж буй хариуг буцаасан. Аутентификаци шаардлагатай endpoint-ууд токенгүй хүсэлтийг зөв татгалзаж, 401 статус код буцааж байна. Алдааны тохиолдолд тохирсон мессеж болон статус кодыг буцааж байгааг баталгаажуулсан.

### 4.1.2 Unit test

Системийн үндсэн гол функцуудэд Jest JavaScript ашиглан логик үйлдлүүдэд тус бүр test хийж шалгасан. Жишээлбэл, дуудлага худалдаанд үнэ өгөх, хэрэглэгч бүртгэх, нэвтрэх гэх мэт үйлдлүүдэд mock мэдээллээр хүсэлт илгээж хариу тус бүрийг шалгасан.

#### BiddingController test

> **Зураг 4.1.** Үнэ өгөх тест 1 (Diagrams/testbidding).
> **Зураг 4.2.** Үнэ өгөх тест 2 (Diagrams/bidtest).
> **Зураг 4.3.** Үнэ өгөх тест хариу (Diagrams/biddingres).

Bidding controller-ийн `placeBid` функц нь дараах кейсүүдийг шалгасан:

* **TC-1**: Хүчинтэй санал — Зөв userId, productId, amount → 201 + Bidding баримт.
* **TC-2**: Хангалтгүй balance — User.balance < amount → 400 'Insufficient balance'.
* **TC-3**: Хэт бага үнэ — amount < currentBid + minIncrement → 400 'Bid too low'.
* **TC-4**: Дуусчихсан auction — auctionStatus = 'ended' → 400 'Auction not active'.
* **TC-5**: Хугацаа хэтэрсэн — bidDeadline < now → 400 'Auction expired'.
* **TC-6**: Өөрийн бараа дээр санал — userId === product.user → 403 'Cannot bid on own product'.

Бүгд expected үр дүнг өгсөн.

#### UserController test

> **Зураг 4.4.** Бүртгүүлэх функц (Diagrams/testuser).
> **Зураг 4.5.** Нэвтрэх функц (Diagrams/testuser1).
> **Зураг 4.6.** Нууц үг сэргээх функц (Diagrams/testuser3).

User controller-д шалгасан кейсүүд:

* `register`: Давхар и-мэйл, validation error, амжилттай үүсгэлт.
* `login`: Буруу нууц үг, байхгүй имэйл, амжилттай нэвтрэлт + token.
* `forgotPassword`: Имэйл явуулах, token хүчингүй болох, password reset.

#### ProductController test

> **Зураг 4.7.** Барааг нэмэх, Бараа үзэх функц (Diagrams/testpro).
> **Зураг 4.8.** Барааны тестийн хариу (Diagrams/productresult).

Product controller-д шалгасан:

* `create`: Validation, зургийн тоо ≤ 20, амжилттай үүсгэлт.
* `getById`: Олдох, олдохгүй.
* `update`: Зөвхөн өөрийн бараа, force-update by admin.
* `delete`: Auction идэвхтэй бол устгахгүй.
* `suggestCategory`: 66 ангилалын дотроос top-3 буцаах.

#### Юнит тест хэрэглэх шалтгаан

Манай онлайн дуудлага худалдааны системд юнит тест хэрэглэх гол шалтгаанууд:

* Функц/модуль бүрийн зөв ажиллахыг баталгаажуулах.
* Алдааг эрт олно.
* Тест нь код хэрхэн ажиллах ёстойг харуулна.
* Refactor хийхэд итгэлтэй байдлыг хангана.

Coverage: backend нь 65% line coverage, controller layer 80%+. Mock хийсэн dependency: Mongoose models, bcrypt, jsonwebtoken, nodemailer, cloudinary.

### 4.1.3 Integration test

Манай онлайн дуудлага худалдааны системийн үндсэн функцүүдийн хоорондын уялдаа холбоог интеграцийн тестээр шалгасан. Энэ нь:

* Модуль хоорондын интерфейс зөв ажиллах.
* Өгөгдлийн урсгал бүрэн бүтэн байх.
* Алдааны тохиолдолд зохих мессеж буцаах.

> **Зураг 4.9.** Бараа нэмэх функцийн интеграц (Diagrams/addproductinteg.JPG).
> **Зураг 4.10.** Хэрэглэгч бүртгүүлэх, нэвтрэх функц (Diagrams/integ).
> **Зураг 4.11.** Үнэ өгөх функцийн интеграц 1 (Diagrams/placebidint).
> **Зураг 4.12.** Үнэ өгөх функцийн интеграц 2 (Diagrams/placebidint2).

Интеграц тест нь Supertest + in-memory MongoDB (`mongodb-memory-server`) ашиглан real HTTP request → real DB → real response гэсэн бүх давхаргыг шалгасан. Жишээ нь "place bid" интеграц тест:

1. Test user 2 үүсгэх (seller A, bidder B).
2. A нь бараа нэмнэ.
3. B нь login, balance topup.
4. B placeBid endpoint руу запрос явуулна.
5. Response 201, Bidding баримт DB-д үүссэн эсэхийг шалгана.
6. Product.currentBid update хийгдсэн эсэхийг шалгана.
7. Socket.IO emit-ийг spy хийн шалгана.

Нийт 18 интеграц тест бүх эерэг үр дүн өгсөн.

### 4.1.4 Мобайл аппликейшны тест

Мобайл аппликейшныг дараах төрлийн тестүүдээр шалгасан:

#### Expo Go ашиглан тест

Хөгжүүлэлтийн явцад Expo Go аппликейшн ашиглан бодит төхөөрөмж дээр тест хийсэн:

> **Зураг 4.13.** iOS үйлдлийн систем дээрх дэлгэц (ss/home.jpg).

* iOS төхөөрөмж дээр тест.
* Android төхөөрөмж дээр тест.
* QR код scan хийж шуурхай тест хийх.
* Hot reload ашиглан өөрчлөлтийг шууд харах.

#### Функциональ тест

Мобайл аппликейшны үндсэн функцууд:

* **Нэвтрэх систем** — Google OAuth, утасны дугаараар баталгаажуулалт.
* **Бараа нэмэх** — Зураг оруулах, категори сонгох, мэдээлэл бөглөх.
* **Дуудлага худалдаа** — Үнэ санал болгох, real-time шинэчлэлт.
* **Хайлт, шүүлтүүр** — Барааны хайлт, категориор шүүх.
* **Профайл** — Хэрэглэгчийн мэдээлэл засах, balance харах.

> **Зураг 4.14.** Нэвтрэх дэлгэц (ss/login screen.jpg).
> **Зураг 4.15.** Интернет холболт тасарсан үед (ss/network error.jpg).

#### Платформ хоорондын тест

Дараах төхөөрөмжүүд дээр ажиллагааг шалгасан:

* iPhone (iOS 14+) — iPhone 12, iPhone 14 Pro.
* Android утас (Android 11+) — Samsung Galaxy A52, Xiaomi Redmi Note 11.
* Tablet төхөөрөмжүүд — iPad Air, Samsung Tab S6.
* Өөр өөр дэлгэцийн хэмжээнүүд (320px-аас 1024px хүртэл).

#### Network тест

* ngrok ашиглан орон нутгийн серверт холбогдох.
* API endpoint-үүдийн хариу харах.
* Socket.IO real-time холболт шалгах.
* Интернет холболт тасарсан үед алдааны харуулалт (offline banner).

> **Зураг 4.16.** Категори (ss/categories.jpg).

#### UI/UX тест

> **Зураг 4.17.** Категори сонгосон байгаа байдал (ss/add product category.jpg).

* Монгол хэл дэмжлэг шалгах.
* Навигаци хялбар байх.
* Loading states харуулах (skeleton, spinner).
* Error messages тодорхой байх.
* Touch targets хангалттай том байх (44x44 pixels Apple HIG, Material 48dp).

### 4.1.5 Front-End буюу админ панел

> **Зураг 4.18.** Админ панел (ss/Screenshot 2025-12-25 060418.png).

Админы веб панелын тестийг Chrome, Firefox, Edge browser дээр хийсэн. Бүх үндсэн функц (хэрэглэгчийн жагсаалт, бараа жагсаалт, ангилал засварлах, статистикийн график) бүгд алдаагүй ажилласан.

## 4.2 Гүйцэтгэлийн (Performance) тест

Системийн гүйцэтгэлийг Apache JMeter ашиглан хийсэн ачааллын тестээр шалгасан. Local development орчинд (M1 MacBook Pro, 16GB RAM, MongoDB Atlas free tier):

| Endpoint | RPS | Avg latency | P95 latency | Алдаа % |
|----------|------|-------------|-------------|---------|
| GET /api/product (list 20) | 250 | 85 ms | 220 ms | 0% |
| GET /api/product/:id | 380 | 60 ms | 150 ms | 0% |
| POST /api/users/login | 120 | 180 ms | 380 ms | 0% |
| POST /api/bidding | 200 | 110 ms | 290 ms | 0% |
| GET /api/notifications | 300 | 75 ms | 180 ms | 0% |

**Хүснэгт 4.5.** Endpoint бүрийн гүйцэтгэлийн дундаж үзүүлэлт.

Эндээс харахад үндсэн endpoint-ууд P95 < 400 мс байгаа нь зорилт болгож тогтоосон 500 мс-ын хязгаараас доогуур байна.

**Real-time bid latency** нь Socket.IO дээр дунджаар 45-80 мс байсан (local network); production орчинд интернетийн хэвийн ping-тэй зэрэгцүүлбэл хэрэглэгчид өөрчлөлтийг **< 1 секунд** дотор хүлээж авна гэж тооцоологдсон.

## 4.3 Аюулгүй байдлын тест (OWASP Top-10)

| OWASP эрсдэл | Тайлбар | Хэрэгжүүлсэн хамгаалалт |
|-------------|---------|------------------------|
| A01: Broken Access Control | Зөвшөөрөл алдагдах | Role-based middleware, ownership check |
| A02: Cryptographic Failures | Сул хэшлэлт | bcrypt 10 round, HTTPS only |
| A03: Injection | NoSQL injection | Mongoose strict mode, sanitize input |
| A04: Insecure Design | Чахуулагдсан flow | Threat model, бизнес логик validation |
| A05: Security Misconfiguration | Default config | helmet, .env, no debug in prod |
| A06: Vulnerable Components | Хуучин npm | `npm audit`, Dependabot |
| A07: Auth Failures | Brute force | express-rate-limit, account lockout |
| A08: Software Integrity | Tampering | Package-lock.json, signed releases |
| A09: Logging Failures | Аудит дутагдал | Winston logs, Sentry |
| A10: SSRF | Server-side request forgery | URL validation, deny private IPs |

**Хүснэгт 4.6.** OWASP Top-10 хамгаалалтын тойм.

Penetration test хийгдээгүй; ирээдүйн ажилд оруулна.

## 4.4 Системийн үр дүн

Хөгжүүлсэн онлайн дуудлага худалдааны систем нь:

* **3 платформ** — Web (React.js), Mobile (React Native), Backend (Node.js).
* **66 категори** — Монгол зах зээлд зориулсан категориуд.
* **Real-time систем** — Socket.IO ашиглан бодит цагийн дуудлага худалдаа.
* **Олон төрлийн нэвтрэх** — Google, утасны дугаар, и-мэйл.
* **Аюулгүй байдал** — JWT токен, bcrypt шифрлэлт.
* **Төлбөрийн систем** — QPay интеграц (төлөвлөгөөтэй).
* **Мэдэгдлийн систем** — Firebase Cloud Messaging.
* **11 MongoDB collection** — User, Product, Bidding, Category, Watchlist, Review, Transaction, Notification, Report, Like, NotificationSettings.
* **34+ REST endpoint** — Бүгд тестлэгдсэн.
* **Бодит зургийн ажиллагаа** — Cloudinary CDN-д хадгалагдаж байгаа.

## 4.5 Гүйцэтгэлийн үр дүн

Системийн гүйцэтгэл:

* Хуудас ачаалах хугацаа: 2-3 секунд.
* API хариу өгөх хугацаа: 200-500 мс.
* Real-time үнийн шинэчлэлт: < 1 секунд.
* Зураг ачаалах: Cloudinary CDN ашиглан хурдан.
* Мобайл апп хэмжээ: ~50 MB (Expo).

## 4.6 Зорилтын биелэлтийн шалгалт

Бүлэг 0-д тогтоосон зорилтуудыг (1-7) дараах байдлаар биелүүлсэн:

| # | Зорилт | Биелэлт | Тайлбар |
|---|--------|---------|---------|
| 1 | Real-time data | ✓ | Socket.IO bidUpdate, < 1 сек |
| 2 | QPay интеграц | ⚙ Phase 1 | Архитектур бэлэн, sandbox тест хийгдсэн |
| 3 | Google OAuth | ✓ | Веб, мобайл дээр хэрэгжсэн |
| 4 | Автомат дуудлага | ✓ | Cron job, ялагч тогтоох, balance шилжүүлэх |
| 5 | MongoDB | ✓ | Atlas cluster, 11 collection |
| 6 | Аюулгүй байдал/гүйцэтгэл | ✓ | JWT+bcrypt+helmet, P95 < 400 мс |
| 7 | Тест | ✓ | Unit + Integration + API + Mobile |

**Хүснэгт 4.7.** Зорилтын биелэлт.

## 4.7 Хязгаарлалт ба мэдэгдсэн дутагдал

Системийн одоогийн хязгаарлалтууд:

* **QPay** нь sandbox орчинд тестлэгдсэн боловч бодит merchant agreement байгуулагдаагүй.
* **Live video streaming** функц одоогоор үгүй; Shopee-маягийн video auction нь ирээдүйн ажилд орсон.
* **Penetration test** мэргэжлийн третьею тал-ын зүгээс хийгдээгүй.
* **i18n** — Англи хэлний UI бүрэн хөрвүүлэгдээгүй (~80% хүрсэн).
* **Offline mode** — Хязгаарлагдмал. Хийгдсэн мэдээллийг кэшлэх боломжтой боловч placeBid offline-д ажиллахгүй.
* **Multi-currency** — Зөвхөн төгрөг (₮). USD, RMB зэрэг гадаад валют дэмжих нь ирээдүйн ажил.

## 4.8 Бүлгийн дүгнэлт

Энэ бүлэгт системийг API, юнит, интеграц, мобайл, гүйцэтгэл, аюулгүй байдлын зургаан өөр өнцгөөс шалгасан үр дүнг тоон утга бүхий хүснэгтээр харуулсан. Бүх тогтоосон зорилт биелэгдсэн (1 нь "phase 1") бөгөөд гүйцэтгэлийн зорилго (P95 < 500 мс, real-time < 1 сек) хэвээр давамгайлж байна. Hard limit-аас давсан тохиолдол байхгүй, бүх алдааны тохиолдол зөв 4xx/5xx статус кодоор хариулдаг гэдгийг баталгаажуулсан.
