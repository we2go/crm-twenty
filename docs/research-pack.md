# Research Pack — запись документа, привязанного к сущности

Research Pack — это документ-заметка, привязанная к Компании (Company), Контакту (Person) или Сделке (Opportunity). Каждый новый research — **отдельная запись** (новая заметка `Note`).

## Как это устроено

- Переиспользуется стандартный объект **`note`** (заметка) и **`noteTarget`** (связка заметки с сущностью).
- Тело документа хранится в `bodyV2`:
  - `bodyV2.markdown` — текстовое представление (удобно парсить и писать агенту);
  - `bodyV2.blocknote` — JSON для BlockNote-редактора в UI (заполняется автоматически).
- Бэкенд сам конвертирует markdown ↔ blocknote при записи/чтении — **агенту достаточно работать с markdown**.
- Маркер: заголовок заметки начинается с **`Research`** (например `Research: конкурентный анализ`). Такие заметки показываются во вкладке **Research Pack** на странице сущности.

## API для агентов

Все операции — стандартный GraphQL workspace API (`<base-url>/graphql`), те же, что для обычных заметок.

### Создать research pack (новая запись)

```graphql
mutation CreateNote {
  createOneNote(
    data: {
      title: "Research: <тема>"
      bodyV2: { markdown: "# Итоги исследования\n\n- факт 1\n- факт 2" }
      position: "last"
    }
  ) {
    id
  }
}
```

Затем привязать к сущности (одна из трёх колонок — по типу сущности):

```graphql
mutation CreateNoteTarget {
  createOneNoteTarget(
    data: {
      noteId: "<noteId>"
      # Для компании:   targetCompanyId: "<companyId>"
      # Для контакта:   targetPersonId: "<personId>"
      # Для сделки:     targetOpportunityId: "<opportunityId>"
      targetCompanyId: "<companyId>"
    }
  ) {
    id
  }
}
```

### Обновить содержимое

```graphql
mutation UpdateNote {
  updateOneNote(
    where: { id: "<noteId>" }
    data: { bodyV2: { markdown: "…новый текст…" } }
  ) {
    id
  }
}
```

### Прочитать research pack по сущности

```graphql
query FindResearchPacks {
  findManyNoteTargets(
    filter: {
      # join-колонка по типу сущности
      targetCompanyId: { eq: "<companyId>" }
    }
    orderBy: [{ createdAt: DescNullsFirst }]
  ) {
    id
    note {
      id
      title
      bodyV2 {
        markdown
        blocknote
      }
    }
  }
}
```

Записи, где `title` начинается с `Research`, — это research pack'и.

## Заметки

- Research pack — это обычная заметка: её можно удалить/восстановить как заметку, она попадает в таймлайн и полнотекстовый поиск.
- Если переименовать заметку так, что заголовок больше не начинается с `Research`, она скроется из вкладки Research Pack, но останется во вкладке Notes.
- Константа маркера: `RESEARCH_PACK_NOTE_TITLE_PREFIX = 'Research'` (frontend).
