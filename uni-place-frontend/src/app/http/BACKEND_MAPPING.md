# Backend Mapping (uni-place-backend)

`src2222222222222`의 `event/program` API는 현재 백엔드 컨트롤러에 존재하지 않습니다.

## Removed
- `eventApi` (`/api/events*`)
- `programApi` (`/api/programs*`, `/api/program-applies*`)

## Replaced With
- `bannerApi`
  - `GET /banners/active`
  - `GET /banners/{banId}`
- `buildingApi`
  - `GET /buildings`
  - `GET /buildings/{buildingId}`
  - `GET /buildings/{buildingId}/rooms`
  - `GET /buildings/{buildingId}/spaces`
- `roomApi`
  - `GET /rooms`
  - `GET /rooms/{roomId}`
- `noticeApi`
  - `GET /notices`
  - `GET /notices/{noticeId}`
- `tourReservationApi`
  - `GET /tour-reservations/rooms`
  - `GET /tour-reservations/slots`
  - `POST /tour-reservations`
  - `POST /tour-reservations/lookup`
  - `PUT /tour-reservations/cancel/{tourId}`

## Paging Notes
- `/buildings`, `/buildings/{id}/rooms`, `/buildings/{id}/spaces`, `/tour-reservations/*`: `page`는 1-base
- `/notices` (`PageableDefault`): `page`는 0-base
