# Research Pack — файловый подход (attachment)

## Идея

Research pack — это **файл** (стандартный механизм `Attachment` в Twenty), привязанный к
сущности (компания / контакт / сделка). Он **не** является заметкой и не попадает во
вкладку «Заметки».

Каждый новый ресерч — это **отдельная запись** (отдельный attachment), а не один
документ.

Поведение — полностью стандартное:

- файл отображается во вкладке **Files** сущности;
- файл отмечается в **timeline** сущности стандартным событием
  `linked-attachment.created` (и `.updated` / `.deleted`).

## Как это работает (механика)

1. `Attachment` — системный объект (workspace-объект с полями `name`, `file`, морфными
   колонками `targetCompanyId` / `targetPersonId` / `targetOpportunityId` и т.д.).
2. Файлы уже рендерятся во вкладке Files — это стандартно, кода не требуется.
3. Timeline: attachments относятся к системным объектам, и раньше их события
   исключались из обработки timeline (см. `SYSTEM_OBJECTS_WITH_TIMELINE_ACTIVITIES`).
   Теперь `attachment` добавлен в этот список, а `TimelineActivityService` для события
   `attachment.created/updated/deleted` читает целевой морф-id (`target<X>Id`) прямо из
   записи и создаёт timeline-активность `linked-attachment.<action>` **на целевой
   сущности** — по образцу `linked-note.*` / `linked-task.*`.

Изменённые файлы:

- `packages/twenty-server/src/modules/timeline/constants/system-objects-with-timeline-activities.constant.ts`
  — добавлен `'attachment'`.
- `packages/twenty-server/src/modules/timeline/services/timeline-activity.service.ts`
  — ветка `objectSingularName === 'attachment'` +
  `computeTimelineActivityPayloadsForAttachments` (эмитит только linked-активности,
  т.к. у attachment нет собственной колонки в `timelineActivity`).

## Как агенту сохранить research pack

### 1. Загрузить файл и получить `fileId`

Через стандартный флоу (как фронтенд-виджет Files):

```graphql
# metadata endpoint (POST /metadata)
mutation CreateFileUpload($filename: String!, $size: Float!, $fileFolder: FileFolder!, $fieldMetadataId: String) {
  createFileUpload(
    filename: $filename
    size: $size
    fileFolder: $fileFolder
    fieldMetadataId: $fieldMetadataId
  ) {
    fileId
    uploadUrl
  }
}
```

Затем `PUT <uploadUrl>` с байтами файла. `fieldMetadataId` — это id поля `file`
объекта `attachment` (тип `FILES`).

### 2. Создать attachment, привязанный к сущности

```graphql
# workspace endpoint (POST /graphql)
mutation CreateAttachment($data: AttachmentCreateInput!) {
  createAttachment(data: $data) {
    id
    name
    targetCompanyId   # или targetPersonId / targetOpportunityId
    file { fileId label }
  }
}
```

Пример данных (research pack для компании):

```json
{
  "name": "Research: <тема>",
  "targetCompanyId": "<companyId>",
  "file": [{ "fileId": "<fileId>", "label": "Research-<тема>.md" }]
}
```

> Примечание: `file[0].fileId` должен ссылаться на реально загруженный файл
> (в dev-окружении статус файла должен быть `UPLOADED`).

### 3. Готово

- Файл появляется во вкладке **Files** сущности.
- В **timeline** сущности появляется событие `linked-attachment.created` с именем
  research pack (на основе `name` / `file[0].label`).

## Как читать research packs

```graphql
query AttachmentsForCompany($companyId: UUID!) {
  attachments(filter: { targetCompanyId: { eq: $companyId } }, orderBy: { createdAt: DescNullsFirst }) {
    edges {
      node {
        id
        name
        file { fileId label url }
        createdAt
      }
    }
  }
}
```

## Примечания

- Timeline-активность `linked-attachment.*` рендерится фронтендом обобщённо (как и
  `linked-note.*` / `linked-task.*`) — отдельных правок фронтенда не требуется.
- Если research pack удаляется — в timeline появится `linked-attachment.deleted`.
- Это минимальное расширение без нового UI/виджетов; поведение «как файлы» — стандартное
  для Twenty.
