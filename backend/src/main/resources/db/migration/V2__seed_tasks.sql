INSERT INTO tasks (title, description, priority, due_date, status, display_order, created_at, updated_at) VALUES
  ('資料作成',         '会議用のスライドを作る',          'high',   '2026-05-10', 'todo',        0, NOW(), NOW()),
  ('買い物リスト作成', '',                                 'low',    NULL,         'todo',        1, NOW(), NOW()),
  ('レビュー対応',     'PR のコメントを反映する',          'medium', '2026-05-09', 'in-progress', 0, NOW(), NOW()),
  ('環境構築',         'Docker と Postgres を立ち上げる',  'high',   NULL,         'in-progress', 1, NOW(), NOW()),
  ('README 更新',      '起動手順を追記する',                'low',    NULL,         'done',        0, NOW(), NOW());
