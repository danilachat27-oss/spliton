# Staging manual QA checklist

Выполнять на **staging** с live env (`NEXT_PUBLIC_*_DATA_SOURCE=live`). Backend — источник истины. Никаких fake success / silent mock.

**Seed:** [STAGING_SEED.md](./STAGING_SEED.md)  
**Test user:** `staging.qa.investor@spliton.test`

---

## 1. Auth

- [ ] Login email/password → redirect на `/app` или `?next=`
- [ ] Logout → protected routes редиректят на `/login`
- [ ] Refresh session (перезагрузка вкладки) — остаётесь залогинены
- [ ] `?next=/catalog/buy/<id>` после login возвращает на buy
- [ ] Cookie `spliton_session` (hint) + refresh cookie на backend domain
- [ ] Cross-domain: frontend staging + API staging — CORS без ошибок в Network

## 2. Catalog / Buy

- [ ] `/catalog` — список из live API (не пустой после seed)
- [ ] Фильтры / сортировка — без `undefined`/`NaN`
- [ ] Release detail — данные совпадают с API
- [ ] Buy без auth — login gate, нет кнопки «Купить юниты»
- [ ] Buy с auth + баланс — preview round, consent при необходимости, ордер после backend
- [ ] Insufficient balance — RU сообщение, ссылка на deposit
- [ ] Closed round — «раунд распродан» / недоступно (если есть такой release)

## 3. Wallet

- [ ] `/assets/overview` — баланс из API
- [ ] `/assets/activity` — транзакции или пустое состояние
- [ ] `/assets/payouts/deposit` — адрес или честное «недоступно»
- [ ] Withdraw: invalid TRC20 → `Адрес TRC20: начинается с T, 34 символа.`
- [ ] Withdraw: amount < min → `Минимальная сумма вывода — … USDT.`
- [ ] Withdraw: amount > available → backend/RU ошибка
- [ ] **Valid withdraw request** → статус REQUESTED/PENDING, locked balance, запись в history
- [ ] Нет fake «completed» без backend

## 4. Secondary

- [ ] `/dashboard/secondary-market` — listings из API
- [ ] KPI «Объём · 24ч» — из API, **не** hardcoded `184 200`
- [ ] Create listing — только при наличии holdings; нельзя > owned
- [ ] Buy listing — нельзя купить свой listing
- [ ] Buy чужой active listing — receipt/status только после backend
- [ ] Cancel own listing — успех; чужой — ошибка
- [ ] Trade history — обновляется или пустое состояние корректно

## 5. Analytics

- [ ] Releases analytics загружается
- [ ] Release detail analytics
- [ ] Market overview
- [ ] Watchlist note — **локальная пометка** (browser-only), не backend watchlist

## 6. Support

- [ ] `/support` — email-only в live (нет fake operator chat)
- [ ] `/dashboard/support` — форма тикета → live API
- [ ] Нет «оператор подключён» в production-like режиме

## 7. Errors

- [ ] Нет raw English / internal stack в UI
- [ ] Нет `undefined`, `null`, `NaN` на wallet/catalog/secondary
- [ ] Retry / empty states на ошибках API
- [ ] 401 на protected → redirect login

## 8. Mobile (viewport ~390px)

- [ ] Catalog
- [ ] Buy flow
- [ ] Wallet overview
- [ ] Withdraw wizard
- [ ] Secondary market
- [ ] Support

## 10. Financial correctness after secondary trade

**Предусловия:** `prisma migrate deploy` + ownership ledger backfill (`npm run finance:ownership-ledger:backfill -- --apply` на staging).

1. User A владеет 10 units релиза (проверить holdings в API).
2. Earning period закрыт (`periodEnd` в прошлом).
3. **После cutoff** User A продаёт 4 units User B на secondary (или полная продажа 10 → B).
4. Admin: preview → approve → run distribution за **закрытый** период.
5. **Ожидание:**
   - [ ] User A получает payout за 10 units (не 6, не 0)
   - [ ] User B **не** получает payout за этот прошлый период
   - [ ] `earning_period_holder_snapshots` содержит A с 10 units
   - [ ] Нет duplicate payout (повторный run → 409)
6. Новый период: после trade A=6, B=4 → run distribution.
7. **Ожидание:**
   - [ ] Payout split 6/4 пропорционально
8. Проверить:
   - [ ] `/assets/payouts/history` — начисления из API
   - [ ] Подсказка: «Начисления рассчитываются по владельцам долей на дату окончания периода»
   - [ ] Wallet transactions / ledger balanced
   - [ ] Нет negative available/locked

## 11. Admin cancel secondary listing

1. User создаёт ACTIVE listing (units locked).
2. Admin (COMPLIANCE/ADMIN) отменяет listing с note.
3. **Ожидание:**
   - [ ] Listing `CANCELLED`
   - [ ] `unitsLocked` уменьшился, `unitsAvailable` восстановился
   - [ ] Audit log `listing.cancel`
   - [ ] Повторный admin cancel → controlled 409
4. User cancel own listing — по-прежнему работает (regression).

## 12. Price history after secondary trade

1. Выполнить 2 secondary trades по одному release.
2. Открыть market depth / price chart / terminal.
3. **Ожидание:**
   - [ ] Price history ≥ 1–2 points из API (не пустой mock)
   - [ ] В live нет demo `184 200` в KPI
   - [ ] Empty state корректен, если trades нет

## 9. Production env readiness (на staging проверить parity)

- [ ] Все `NEXT_PUBLIC_*_DATA_SOURCE=live`
- [ ] Build проходит без mock
- [ ] Нет silent fallback на mock при ошибке API
- [ ] Нет fake success states (receipt, withdraw completed, demo purchase)

---

## Sign-off

| Area | Tester | Date | Pass |
|------|--------|------|------|
| Auth + cookies | | | |
| Buy + balance | | | |
| Withdraw | | | |
| Secondary | | | |
| Mobile | | | |

**Production gate:** все критичные строки ☑ + automated CI green.
