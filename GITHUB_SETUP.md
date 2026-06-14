# 📦 Пушим на GitHub - Пошаговая инструкция

## 1️⃣ Создание репозитория на GitHub

### Способ A: Через веб-интерфейс (проще)

1. Откройте https://github.com/new
2. **Repository name:** `lali-tattoo-artist`
3. **Description:** `Tattoo booking app for Telegram`
4. **Visibility:** Public (или Private, как хотите)
5. НЕ инициализируйте README (мы уже создали)
6. Нажмите **Create repository**

Скопируйте URL вашего репозитория (выглядит как: `https://github.com/YOUR_USERNAME/lali-tattoo-artist.git`)

## 2️⃣ Подготовка локального кода

### Шаг 1: Проверьте Git установку

```bash
git --version
git config --global user.name "Ваше имя"
git config --global user.email "ваш@email.com"
```

### Шаг 2: Создайте папку проекта

```bash
mkdir lali-tattoo-artist
cd lali-tattoo-artist
```

### Шаг 3: Поместите все файлы

Скопируйте все файлы из `/outputs` в папку `lali-tattoo-artist`:
- package.json
- vite.config.ts
- tsconfig.json
- tailwind.config.js
- postcss.config.js
- index.html
- .env.example
- .gitignore
- README.md
- Все папки src/

Структура должна быть:
```
lali-tattoo-artist/
├── src/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── index.html
├── .env.example
├── .gitignore
├── README.md
└── ... (другие конфиги)
```

## 3️⃣ Инициализация Git репозитория

```bash
# Находимся в папке lali-tattoo-artist
cd lali-tattoo-artist

# Инициализируем git
git init

# Добавляем все файлы в staging area
git add .

# Проверяем что добавилось
git status
```

Вывод должен показать все файлы зеленым цветом (ready to commit).

## 4️⃣ Первый коммит

```bash
git commit -m "Initial commit: Create LALI tattoo booking app"
```

## 5️⃣ Подключение удаленного репозитория

Замените `YOUR_USERNAME` на ваш GitHub username:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lali-tattoo-artist.git
git remote -v
```

Проверка (должны увидеть две строки с origin):
```
origin  https://github.com/YOUR_USERNAME/lali-tattoo-artist.git (fetch)
origin  https://github.com/YOUR_USERNAME/lali-tattoo-artist.git (push)
```

## 6️⃣ Пушим в GitHub

```bash
git push -u origin main
```

Если просит пароль - используйте Personal Access Token вместо пароля:

### Создание Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Generate new token
3. Token name: `lali-tattoo-dev`
4. Expiration: 90 days
5. Permissions:
   - ✅ Contents (read & write)
   - ✅ Metadata (read)
6. Generate
7. Скопируйте токен (больше не будет видно!)

При пушении вместо пароля используйте этот токен.

## ✅ Проверка

Откройте https://github.com/YOUR_USERNAME/lali-tattoo-artist

Должны увидеть все файлы в main branch.

## 🔄 Дальше для обновлений

```bash
# После изменений:
git add .
git commit -m "Описание изменений"
git push origin main

# Или быстро:
git add . && git commit -m "Update" && git push
```

## 🎯 Быстрый чек-лист

- [ ] Создан репозиторий на GitHub
- [ ] Скопирована URL репозитория
- [ ] Git инициализирован (`git init`)
- [ ] Все файлы добавлены (`git add .`)
- [ ] Первый коммит сделан (`git commit -m "..."`)
- [ ] Remote добавлен (`git remote add origin`)
- [ ] Push сделан (`git push -u origin main`)
- [ ] Файлы видны на GitHub

## 💡 Полезные команды Git

```bash
# Проверить статус
git status

# Просмотреть историю коммитов
git log --oneline

# Отменить последний коммит (если он еще не запушен)
git reset --soft HEAD~1

# Посмотреть удаленные репозитории
git remote -v

# Обновить main с удаленного
git pull origin main
```

## 🚀 Готовы деплоить?

Когда запушите на GitHub, можете залить на Vercel:

```bash
npm install -g vercel
vercel --prod
```

Vercel автоматически:
- Подключится к вашему GitHub
- Будет деплоить при каждом push в main
- Будет создавать preview для pull requests

---

**Поздравляем! Ваш проект на GitHub!** 🎉
