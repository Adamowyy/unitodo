// Every user-visible string, one table per language; English is the fallback.

const DEFAULT_LANGUAGE = 'en';
const LANGUAGES = ['en', 'pl'];            // order = order of the switcher
const LOCALES = { en: 'en-GB', pl: 'pl-PL' }; // date/number formatting
const COOKIE_NAME = 'lang';
const COOKIE_MAX_AGE = 365 * 24 * 3600 * 1000;

const STRINGS = {
  en: {
    // app chrome
    'app.name': 'UniTodo',
    'app.tagline': 'Tasks and notes, for solo work and for teams',
    'nav.groups': 'Groups',
    'nav.logout': 'Log out',
    'nav.toggle_theme': 'Switch theme',
    'nav.admin_panel': 'Admin panel',
    'nav.language': 'Language',

    // generic buttons and labels
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.add': 'Add',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.clear': 'Clear',
    'common.copy': 'Copy',
    'common.close': 'Close',
    'common.search_placeholder': 'Search…',
    'common.search_label': 'Results for',
    'common.back_home': '← Back to the home page',

    // page titles
    'page.login': 'Log in',
    'page.register': 'Sign up',
    'page.change_password': 'Change password',
    'page.members': 'Members',
    'page.notes': 'Notes',
    'page.tasks': 'Tasks',
    'page.admin': 'Admin',
    'page.privacy': 'Privacy policy',
    'page.not_found': 'Page not found',

    // footer
    'footer.desktop_app': 'UniTodo Desktop',
    'footer.also_in_browser': 'Also available in the browser:',
    'footer.download_windows': 'Download the Windows app',
    'footer.privacy': 'Privacy policy',
    'footer.contact': 'Contact',
    'footer.copyright': '© {year} UniTodo',

    // authentication
    'auth.username': 'Username',
    'auth.username_hint': '(letters, digits, underscores)',
    'auth.password': 'Password',
    'auth.password_hint': '(min. 6 characters)',
    'auth.login_button': 'Log in',
    'auth.no_account': 'No account yet?',
    'auth.register_link': 'Sign up',
    'auth.register_button': 'Sign up',
    'auth.have_account': 'Already have an account?',
    'auth.login_link': 'Log in',

    // forced password change
    'password.change_title': 'Change password',
    'password.change_reason': 'Your password was reset by an administrator. Set a new one of your own.',
    'password.new': 'New password',
    'password.confirm': 'Confirm the new password',
    'password.min_hint': 'At least 6 characters',
    'password.save': 'Save the new password',

    // groups
    'groups.mine': 'My groups',
    'groups.join': 'Join a group',
    'groups.join_placeholder': 'Paste an invite code…',
    'groups.join_button': 'Join',
    'groups.new': 'New group',
    'groups.edit': 'Edit group',
    'groups.empty': 'No project groups yet',
    'groups.empty_hint': 'Click "New group" to get started',
    'groups.uncategorized': 'Uncategorized',
    'groups.name': 'Group name',
    'groups.category': 'Category',
    'groups.category_placeholder': 'e.g. Work, Studies, Personal…',
    'groups.description': 'Description (optional)',
    'groups.members_count': '{count} members',
    'groups.notes_tab': 'Notes',
    'groups.tasks_tab': 'Tasks',
    'groups.delete_confirm': 'Delete this group together with all of its data?',
    'groups.leave_confirm': 'Leave this group?',
    'groups.leave': 'Leave',
    'groups.leave_title': 'Leave the group',

    // members
    'members.title': 'Members of {group}',
    'members.role_owner': 'Owner',
    'members.role_member': 'Member',
    'members.remove_confirm': 'Remove {username} from the group?',
    'members.invite_code': 'Invite code:',
    'members.new_code': 'New code',
    'members.new_code_title': 'Generate a new code',
    'members.back': '← Back to the group',

    // notes
    'notes.title': 'Notes',
    'notes.new': 'New note',
    'notes.edit': 'Edit note',
    'notes.empty': 'No notes in this group yet',
    'notes.empty_hint': 'Click "New note" to add the first one',
    'notes.field_title': 'Title',
    'notes.field_content': 'Content',
    'notes.delete_confirm': 'Delete this note?',
    'notes.comment_add': 'Add a comment…',
    'notes.comment_send': 'Send',
    'notes.comment_delete_confirm': 'Delete this comment?',
    'notes.comment_delete_title': 'Delete the comment',

    // tasks
    'tasks.title': 'Tasks',
    'tasks.new': 'New task',
    'tasks.edit': 'Edit task',
    'tasks.field_title': 'Title *',
    'tasks.field_description': 'Description',
    'tasks.field_priority': 'Priority',
    'tasks.field_due': 'Due date',
    'tasks.field_assignee': 'Assign to',
    'tasks.assignee_none': '— Nobody —',
    'tasks.sort': 'Sort:',
    'tasks.sort_created_desc': 'Newest first',
    'tasks.sort_created_asc': 'Oldest first',
    'tasks.sort_priority_desc': 'Priority ↓',
    'tasks.sort_priority_asc': 'Priority ↑',
    'tasks.sort_due_asc': 'Due date ↓',
    'tasks.sort_due_desc': 'Due date ↑',
    'tasks.sort_title_asc': 'Alphabetical',
    'tasks.filter_priority': 'Priority ≥',
    'tasks.filter_all': 'All',
    'tasks.filter_status': 'Status:',
    'tasks.hide_done': 'Hide done',
    'tasks.clear_filters': 'Clear filters',
    'tasks.drop_here': 'Drag tasks here',
    'tasks.none_in_column': 'No tasks',
    'tasks.show_next': 'Show next ({count} of {remaining})',
    'tasks.hide': 'Hide',
    'tasks.status_todo': 'To do',
    'tasks.status_in_progress': 'In progress',
    'tasks.status_done': 'Done',
    'tasks.priority_none': 'None',
    'tasks.priority_low': 'Low',
    'tasks.priority_medium': 'Medium',
    'tasks.priority_high': 'High',
    'tasks.mark_done': 'Mark as done',
    'tasks.delete_confirm': 'Delete this task together with its subtasks?',
    'tasks.subtask_new': 'New subtask',
    'tasks.subtask_title_label': 'Title',
    'tasks.subtask_edit': 'Edit subtask',
    'tasks.subtask_add': 'Add subtask',
    'tasks.subtask_edit_title': 'Edit the subtask',
    'tasks.subtask_delete_title': 'Delete the subtask',
    'tasks.subtask_delete_confirm': 'Delete this subtask?',
    'tasks.move_forward': 'In progress',
    'tasks.move_back': 'Back',
    'tasks.move_done': 'Done',
    'tasks.restore': 'Restore',

    // admin panel
    'admin.title': 'Admin panel',
    'admin.reset_password_for': 'New password for user #{id}:',
    'admin.reset_password_hint': 'Copy it now, it will not be shown again.',
    'admin.stat_users': 'Users',
    'admin.stat_groups': 'Groups',
    'admin.stat_items': 'Tasks/notes',
    'admin.registrations': 'Registrations — last 7 days',
    'admin.recent_accounts': 'Recent accounts',
    'admin.col_id': 'ID',
    'admin.col_username': 'Username',
    'admin.col_created': 'Created',
    'admin.col_actions': 'Actions',
    'admin.reset_password': 'Reset password',
    'admin.reset_confirm': 'Reset the password of {username}?',
    'admin.delete_confirm': 'DELETE user {username} and all of their data? This cannot be undone!',
    'admin.deleted': 'User #{id} has been deleted.',

    // errors
    'error.403_title': '403 — Access denied',
    'error.no_admin_rights': 'You do not have administrator rights.',
    'error.username_required': 'A username is required',
    'error.username_too_short': 'The username must have at least 3 characters',
    'error.username_too_long': 'The username can have at most 30 characters',
    'error.username_charset': 'The username may contain only letters, digits and underscores',
    'error.password_required': 'A password is required',
    'error.password_too_short': 'The password must have at least 6 characters',
    'error.password_too_long': 'The password is too long',
    'error.password_mismatch': 'The passwords do not match.',
    'error.username_taken': 'That username is already taken',
    'error.invalid_credentials': 'Invalid username or password',
    'error.server': 'Server error',
    'error.server_retry': 'Server error. Please try again.',
    'error.rate_login': 'Too many login attempts. Try again in 15 minutes.',
    'error.rate_register': 'Too many registrations. Try again in an hour.',
    'error.group_name_required': 'A group name is required',
    'error.invite_code_invalid': 'Invalid invite code',
    'error.title_required': 'A title is required',
    'error.cannot_delete_self': 'You cannot delete yourself.',
    'error.not_found_body': 'The page you are looking for does not exist.',
    'error.back_home': 'Back to the home page',

    // privacy policy
    'privacy.updated': 'Last updated: 15 June 2026',
    'privacy.s1_title': '1. Who runs this instance',
    'privacy.s1_body': 'The administrator of your personal data is the operator of the UniTodo instance you are using. Every UniTodo instance is self-hosted: whoever deploys it is its data controller.',
    'privacy.s1_contact': 'For any request concerning your data, contact the operator of the instance you registered on.',
    'privacy.s2_title': '2. What data we collect',
    'privacy.s2_body': 'While you use the app we collect the following data:',
    'privacy.s2_username': '<strong>Username</strong> — given at sign-up, visible to the other members of your groups.',
    'privacy.s2_password': '<strong>Password</strong> — stored only as a hash (bcrypt). Plain-text passwords are never stored.',
    'privacy.s2_content': '<strong>Content you create</strong> — group names, descriptions, notes, tasks, subtasks, priorities, due dates.',
    'privacy.s2_technical': '<strong>Technical data</strong> — the cookies the app needs to work (the session JWT).',
    'privacy.s3_title': '3. How the data is stored',
    'privacy.s3_db': 'All data lives in the <strong>PostgreSQL</strong> database configured by the operator of the instance.',
    'privacy.s3_location': 'The location of the database and of the application servers is decided by the operator.',
    'privacy.s3_hash': 'Passwords are hashed with <strong>bcrypt</strong> — not even an administrator can read yours.',
    'privacy.s4_title': '4. Cookies',
    'privacy.s4_body': 'The app uses <strong>only the cookies it needs</strong>:',
    'privacy.s4_token': '<strong>token</strong> — the session cookie holding the JWT, required to stay signed in. It expires after 7 days.',
    'privacy.s4_dark': '<strong>darkMode</strong> — the theme preference, kept in the browser localStorage (not a cookie).',
    'privacy.s4_lang': '<strong>lang</strong> — the interface language you picked, kept for a year.',
    'privacy.s4_no_tracking': 'No marketing, analytics or tracking cookies are used.',
    'privacy.s5_title': '5. Who the data is shared with',
    'privacy.s5_body': '<strong>Nobody.</strong> Your data is not sold, shared or handed to third parties. It is used only to run the app.',
    'privacy.s5_visibility': 'Your username is visible to the other members of the groups you belong to, which is what makes collaboration work.',
    'privacy.s6_title': '6. Your rights',
    'privacy.s6_body': 'You may request the following at any time:',
    'privacy.s6_access': '<strong>Access</strong> — you can check what data is stored about you.',
    'privacy.s6_rectify': '<strong>Rectification</strong> — you can correct your data.',
    'privacy.s6_erase': '<strong>Erasure</strong> — you can ask for your account and all related data to be deleted.',
    'privacy.s6_portability': '<strong>Portability</strong> — you can receive a copy of your data.',
    'privacy.s7_title': '7. Security',
    'privacy.s7_body': 'The following safeguards are in place:',
    'privacy.s7_tls': 'Encrypted transport — all connections go over HTTPS (TLS).',
    'privacy.s7_bcrypt': 'Password hashing — bcrypt with a per-password salt.',
    'privacy.s7_jwt': 'JWT authentication — tokens signed with a secret key held by the operator.',
    'privacy.s7_isolation': 'Data isolation — a user only sees the groups they belong to.',
    'privacy.s8_title': '8. Changes to this policy',
    'privacy.s8_body': 'This policy may change. Any material change will be announced in the app or on the instance page.',

    // strings used by the front-end JavaScript
    'client.sync_new_changes': 'New changes — <span class="underline font-medium">refresh</span>',
    'client.group_new': 'New group',
    'client.group_edit': 'Edit group',
    'client.note_new': 'New note',
    'client.note_edit': 'Edit note',
    'client.task_new': 'New task',
    'client.task_edit': 'Edit task',
    'client.subtask_new': 'New subtask',
    'client.subtask_edit': 'Edit subtask',
    'client.add': 'Add',
    'client.save': 'Save',
    'client.show_next': 'Show next ({count} of {remaining})',
    'client.hide': 'Hide'
  },

  pl: {
    'app.name': 'UniTodo',
    'app.tagline': 'Zadania i notatki, do pracy solo i w grupie',
    'nav.groups': 'Grupy',
    'nav.logout': 'Wyloguj',
    'nav.toggle_theme': 'Przełącz motyw',
    'nav.admin_panel': 'Panel administratora',
    'nav.language': 'Język',

    'common.save': 'Zapisz',
    'common.cancel': 'Anuluj',
    'common.add': 'Dodaj',
    'common.delete': 'Usuń',
    'common.edit': 'Edytuj',
    'common.clear': 'Wyczyść',
    'common.copy': 'Kopiuj',
    'common.close': 'Zamknij',
    'common.search_placeholder': 'Szukaj…',
    'common.search_label': 'Wyniki dla',
    'common.back_home': '← Powrót do strony głównej',

    'page.login': 'Logowanie',
    'page.register': 'Rejestracja',
    'page.change_password': 'Zmiana hasła',
    'page.members': 'Członkowie',
    'page.notes': 'Notatki',
    'page.tasks': 'Zadania',
    'page.admin': 'Administrator',
    'page.privacy': 'Polityka prywatności',
    'page.not_found': 'Nie znaleziono strony',

    'footer.desktop_app': 'UniTodo Desktop',
    'footer.also_in_browser': 'Dostępna również przez przeglądarkę:',
    'footer.download_windows': 'Pobierz aplikację na Windows',
    'footer.privacy': 'Polityka prywatności',
    'footer.contact': 'Kontakt',
    'footer.copyright': '© {year} UniTodo',

    'auth.username': 'Nazwa użytkownika',
    'auth.username_hint': '(litery, cyfry, podkreślenia)',
    'auth.password': 'Hasło',
    'auth.password_hint': '(min. 6 znaków)',
    'auth.login_button': 'Zaloguj',
    'auth.no_account': 'Nie masz konta?',
    'auth.register_link': 'Zarejestruj się',
    'auth.register_button': 'Zarejestruj',
    'auth.have_account': 'Masz już konto?',
    'auth.login_link': 'Zaloguj się',

    'password.change_title': 'Zmień hasło',
    'password.change_reason': 'Twoje hasło zostało zresetowane przez administratora. Ustaw nowe, własne hasło.',
    'password.new': 'Nowe hasło',
    'password.confirm': 'Potwierdź nowe hasło',
    'password.min_hint': 'Minimum 6 znaków',
    'password.save': 'Zapisz nowe hasło',

    'groups.mine': 'Moje grupy',
    'groups.join': 'Dołącz do grupy',
    'groups.join_placeholder': 'Wklej kod zaproszenia…',
    'groups.join_button': 'Dołącz',
    'groups.new': 'Nowa grupa',
    'groups.edit': 'Edytuj grupę',
    'groups.empty': 'Brak grup projektów',
    'groups.empty_hint': 'Kliknij "Nowa grupa", aby rozpocząć',
    'groups.uncategorized': 'Bez kategorii',
    'groups.name': 'Nazwa grupy',
    'groups.category': 'Kategoria',
    'groups.category_placeholder': 'np. Praca, Studia, Osobiste…',
    'groups.description': 'Opis (opcjonalnie)',
    'groups.members_count': '{count} członków',
    'groups.notes_tab': 'Notatki',
    'groups.tasks_tab': 'Zadania',
    'groups.delete_confirm': 'Usunąć grupę wraz ze wszystkimi danymi?',
    'groups.leave_confirm': 'Opuścić tę grupę?',
    'groups.leave': 'Opuść',
    'groups.leave_title': 'Opuść grupę',

    'members.title': 'Członkowie grupy: {group}',
    'members.role_owner': 'Właściciel',
    'members.role_member': 'Członek',
    'members.remove_confirm': 'Usunąć {username} z grupy?',
    'members.invite_code': 'Kod zaproszenia:',
    'members.new_code': 'Nowy kod',
    'members.new_code_title': 'Wygeneruj nowy kod',
    'members.back': '← Powrót do grupy',

    'notes.title': 'Notatki',
    'notes.new': 'Nowa notatka',
    'notes.edit': 'Edytuj notatkę',
    'notes.empty': 'Brak notatek w tej grupie',
    'notes.empty_hint': 'Kliknij "Nowa notatka", aby dodać pierwszą',
    'notes.field_title': 'Tytuł',
    'notes.field_content': 'Treść',
    'notes.delete_confirm': 'Usunąć notatkę?',
    'notes.comment_add': 'Dodaj komentarz…',
    'notes.comment_send': 'Wyślij',
    'notes.comment_delete_confirm': 'Usunąć komentarz?',
    'notes.comment_delete_title': 'Usuń komentarz',

    'tasks.title': 'Zadania',
    'tasks.new': 'Nowe zadanie',
    'tasks.edit': 'Edytuj zadanie',
    'tasks.field_title': 'Tytuł *',
    'tasks.field_description': 'Opis',
    'tasks.field_priority': 'Priorytet',
    'tasks.field_due': 'Termin',
    'tasks.field_assignee': 'Przypisz do',
    'tasks.assignee_none': '— Nikt —',
    'tasks.sort': 'Sortuj:',
    'tasks.sort_created_desc': 'Najnowsze',
    'tasks.sort_created_asc': 'Najstarsze',
    'tasks.sort_priority_desc': 'Priorytet ↓',
    'tasks.sort_priority_asc': 'Priorytet ↑',
    'tasks.sort_due_asc': 'Termin ↓',
    'tasks.sort_due_desc': 'Termin ↑',
    'tasks.sort_title_asc': 'Alfabetycznie',
    'tasks.filter_priority': 'Priorytet ≥',
    'tasks.filter_all': 'Wszystkie',
    'tasks.filter_status': 'Status:',
    'tasks.hide_done': 'Ukryj zrobione',
    'tasks.clear_filters': 'Wyczyść filtry',
    'tasks.drop_here': 'Przeciągnij zadania tutaj',
    'tasks.none_in_column': 'Brak zadań',
    'tasks.show_next': 'Pokaż kolejne ({count} z {remaining})',
    'tasks.hide': 'Ukryj',
    'tasks.status_todo': 'Do zrobienia',
    'tasks.status_in_progress': 'W trakcie',
    'tasks.status_done': 'Zrobione',
    'tasks.priority_none': 'Brak',
    'tasks.priority_low': 'Niski',
    'tasks.priority_medium': 'Średni',
    'tasks.priority_high': 'Wysoki',
    'tasks.mark_done': 'Oznacz jako zrobione',
    'tasks.delete_confirm': 'Usunąć zadanie wraz z podzadaniami?',
    'tasks.subtask_new': 'Nowe podzadanie',
    'tasks.subtask_title_label': 'Tytuł',
    'tasks.subtask_edit': 'Edytuj podzadanie',
    'tasks.subtask_add': 'Dodaj podzadanie',
    'tasks.subtask_edit_title': 'Edytuj podzadanie',
    'tasks.subtask_delete_title': 'Usuń podzadanie',
    'tasks.subtask_delete_confirm': 'Usunąć podzadanie?',
    'tasks.move_forward': 'W trakcie',
    'tasks.move_back': 'Cofnij',
    'tasks.move_done': 'Zrobione',
    'tasks.restore': 'Przywróć',

    'admin.title': 'Panel administratora',
    'admin.reset_password_for': 'Nowe hasło dla użytkownika #{id}:',
    'admin.reset_password_hint': 'Skopiuj je teraz, nie będzie ponownie widoczne.',
    'admin.stat_users': 'Użytkowników',
    'admin.stat_groups': 'Grup',
    'admin.stat_items': 'Zadań/notatek',
    'admin.registrations': 'Rejestracje — ostatnie 7 dni',
    'admin.recent_accounts': 'Ostatnie konta',
    'admin.col_id': 'ID',
    'admin.col_username': 'Nazwa użytkownika',
    'admin.col_created': 'Utworzono',
    'admin.col_actions': 'Akcje',
    'admin.reset_password': 'Reset hasła',
    'admin.reset_confirm': 'Zresetować hasło użytkownika {username}?',
    'admin.delete_confirm': 'USUNĄĆ użytkownika {username} i wszystkie jego dane? Tej operacji nie można cofnąć!',
    'admin.deleted': 'Użytkownik #{id} został usunięty.',

    'error.403_title': '403 — Brak dostępu',
    'error.no_admin_rights': 'Nie masz uprawnień administratora.',
    'error.username_required': 'Nazwa użytkownika jest wymagana',
    'error.username_too_short': 'Nazwa użytkownika musi mieć min. 3 znaki',
    'error.username_too_long': 'Nazwa użytkownika może mieć max. 30 znaków',
    'error.username_charset': 'Nazwa użytkownika może zawierać tylko litery, cyfry i podkreślenia',
    'error.password_required': 'Hasło jest wymagane',
    'error.password_too_short': 'Hasło musi mieć min. 6 znaków',
    'error.password_too_long': 'Hasło jest za długie',
    'error.password_mismatch': 'Hasła nie są identyczne.',
    'error.username_taken': 'Nazwa użytkownika jest już zajęta',
    'error.invalid_credentials': 'Nieprawidłowa nazwa użytkownika lub hasło',
    'error.server': 'Błąd serwera',
    'error.server_retry': 'Błąd serwera. Spróbuj ponownie.',
    'error.rate_login': 'Za dużo prób logowania. Spróbuj ponownie za 15 minut.',
    'error.rate_register': 'Za dużo rejestracji. Spróbuj ponownie za godzinę.',
    'error.group_name_required': 'Nazwa grupy jest wymagana',
    'error.invite_code_invalid': 'Nieprawidłowy kod zaproszenia',
    'error.title_required': 'Tytuł wymagany',
    'error.cannot_delete_self': 'Nie możesz usunąć samego siebie.',
    'error.not_found_body': 'Strona, której szukasz, nie istnieje.',
    'error.back_home': 'Wróć do strony głównej',

    'privacy.updated': 'Ostatnia aktualizacja: 15 czerwca 2026',
    'privacy.s1_title': '1. Kto prowadzi tę instancję',
    'privacy.s1_body': 'Administratorem Twoich danych osobowych jest operator instancji UniTodo, z której korzystasz. Każda instancja UniTodo jest hostowana samodzielnie: administratorem danych jest ten, kto ją wdrożył.',
    'privacy.s1_contact': 'W każdej sprawie dotyczącej Twoich danych skontaktuj się z operatorem instancji, w której założyłeś konto.',
    'privacy.s2_title': '2. Jakie dane zbieramy',
    'privacy.s2_body': 'Podczas korzystania z aplikacji zbieramy następujące dane:',
    'privacy.s2_username': '<strong>Nazwa użytkownika</strong> — podawana podczas rejestracji, widoczna dla innych członków Twoich grup.',
    'privacy.s2_password': '<strong>Hasło</strong> — przechowywane wyłącznie jako hash (bcrypt). Nigdy nie przechowujemy haseł w postaci jawnej.',
    'privacy.s2_content': '<strong>Treści tworzone przez użytkownika</strong> — nazwy grup, opisy, notatki, zadania, podzadania, priorytety, terminy.',
    'privacy.s2_technical': '<strong>Dane techniczne</strong> — pliki cookie niezbędne do działania aplikacji (token JWT sesji).',
    'privacy.s3_title': '3. Jak przechowujemy dane',
    'privacy.s3_db': 'Wszystkie dane znajdują się w bazie <strong>PostgreSQL</strong> skonfigurowanej przez operatora instancji.',
    'privacy.s3_location': 'Lokalizację bazy i serwerów aplikacji wybiera operator instancji.',
    'privacy.s3_hash': 'Hasła są hashowane algorytmem <strong>bcrypt</strong> — nawet administrator nie ma dostępu do Twojego hasła.',
    'privacy.s4_title': '4. Pliki cookie',
    'privacy.s4_body': 'Aplikacja wykorzystuje wyłącznie <strong>niezbędne pliki cookie</strong>:',
    'privacy.s4_token': '<strong>token</strong> — ciasteczko sesyjne przechowujące token JWT, wymagane do utrzymania logowania. Wygasa po 7 dniach.',
    'privacy.s4_dark': '<strong>darkMode</strong> — preferencja trybu ciemnego, przechowywana w localStorage przeglądarki (nie jest to plik cookie).',
    'privacy.s4_lang': '<strong>lang</strong> — wybrany język interfejsu, przechowywany przez rok.',
    'privacy.s4_no_tracking': 'Nie używamy plików cookie marketingowych, analitycznych ani śledzących.',
    'privacy.s5_title': '5. Komu udostępniamy dane',
    'privacy.s5_body': '<strong>Nikomu.</strong> Nie sprzedajemy, nie udostępniamy ani nie przekazujemy Twoich danych podmiotom trzecim. Dane są wykorzystywane wyłącznie w celu działania aplikacji.',
    'privacy.s5_visibility': 'Twoja nazwa użytkownika jest widoczna dla innych członków grup, do których należysz — jest to niezbędne do funkcjonowania funkcji współpracy.',
    'privacy.s6_title': '6. Twoje prawa',
    'privacy.s6_body': 'W każdej chwili możesz zażądać:',
    'privacy.s6_access': '<strong>Dostępu do danych</strong> — możesz sprawdzić, jakie dane przechowujemy.',
    'privacy.s6_rectify': '<strong>Sprostowania danych</strong> — możesz poprawić swoje dane.',
    'privacy.s6_erase': '<strong>Usunięcia danych</strong> — możesz zażądać usunięcia konta i wszystkich powiązanych danych.',
    'privacy.s6_portability': '<strong>Przenoszenia danych</strong> — możesz otrzymać kopię swoich danych.',
    'privacy.s7_title': '7. Bezpieczeństwo',
    'privacy.s7_body': 'Stosujemy następujące zabezpieczenia:',
    'privacy.s7_tls': 'Szyfrowanie transmisji — wszystkie połączenia odbywają się przez HTTPS (TLS).',
    'privacy.s7_bcrypt': 'Hashowanie haseł — bcrypt z solą dla każdego hasła.',
    'privacy.s7_jwt': 'Uwierzytelnianie JWT — tokeny podpisywane tajnym kluczem operatora instancji.',
    'privacy.s7_isolation': 'Izolacja danych — każdy użytkownik widzi tylko grupy, do których należy.',
    'privacy.s8_title': '8. Zmiany w polityce prywatności',
    'privacy.s8_body': 'Polityka może się zmieniać. O wszelkich istotnych zmianach poinformujemy w aplikacji lub na stronie instancji.',

    'client.sync_new_changes': 'Są nowe zmiany — <span class="underline font-medium">odśwież</span>',
    'client.group_new': 'Nowa grupa',
    'client.group_edit': 'Edytuj grupę',
    'client.note_new': 'Nowa notatka',
    'client.note_edit': 'Edytuj notatkę',
    'client.task_new': 'Nowe zadanie',
    'client.task_edit': 'Edytuj zadanie',
    'client.subtask_new': 'Nowe podzadanie',
    'client.subtask_edit': 'Edytuj podzadanie',
    'client.add': 'Dodaj',
    'client.save': 'Zapisz',
    'client.show_next': 'Pokaż kolejne ({count} z {remaining})',
    'client.hide': 'Ukryj'
  }
};

/** True when the value names a language we ship. */
function isLanguage(value) {
  return typeof value === 'string' && LANGUAGES.includes(value.toLowerCase());
}

/** Returns a shipped language code, or null when the value is unusable. */
function normalizeLanguage(value) {
  if (typeof value !== 'string') return null;
  const short = value.trim().toLowerCase().split(/[-_]/)[0];
  return isLanguage(short) ? short : null;
}

/** Picks the best language from an Accept-Language header, English as fallback. */
function fromAcceptLanguage(header) {
  if (!header) return null;
  const preferred = header
    .split(',')
    .map(part => {
      const [tag, quality] = part.trim().split(';q=');
      return { tag: normalizeLanguage(tag), quality: quality ? parseFloat(quality) : 1 };
    })
    .filter(entry => entry.tag)
    .sort((a, b) => b.quality - a.quality);
  return preferred.length > 0 ? preferred[0].tag : null;
}

/** Resolves the language for a request: ?lang= beats the cookie beats the header. */
function resolveLanguage(req) {
  const fromQuery = normalizeLanguage(req.query?.lang);
  if (fromQuery) return { lang: fromQuery, explicit: true };
  const fromCookie = normalizeLanguage(req.cookies?.[COOKIE_NAME]);
  if (fromCookie) return { lang: fromCookie, explicit: false };
  return { lang: fromAcceptLanguage(req.headers?.['accept-language']) || DEFAULT_LANGUAGE, explicit: false };
}

/** Looks up one key, falls back to English, then to the key itself. */
function translate(lang, key, params = {}) {
  const table = STRINGS[lang] || STRINGS[DEFAULT_LANGUAGE];
  const text = table[key] ?? STRINGS[DEFAULT_LANGUAGE][key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) => (
    params[name] === undefined || params[name] === null ? match : String(params[name])
  ));
}

/** Keys the browser needs, with the "client." prefix stripped. */
function clientStrings(lang) {
  const out = {};
  for (const [key, value] of Object.entries(STRINGS[lang] || STRINGS[DEFAULT_LANGUAGE])) {
    if (key.startsWith('client.')) out[key.slice('client.'.length)] = value;
  }
  return out;
}

/** Express middleware: req.lang, res.locals.t / lang / locale / languages. */
function middleware(req, res, next) {
  const { lang, explicit } = resolveLanguage(req);
  const t = (key, params) => translate(lang, key, params);
  req.lang = lang;
  req.t = t;
  res.locals.lang = lang;
  res.locals.locale = LOCALES[lang] || LOCALES[DEFAULT_LANGUAGE];
  res.locals.languages = LANGUAGES;
  res.locals.t = t;
  res.locals.clientStrings = clientStrings(lang);
  if (explicit) {
    res.cookie(COOKIE_NAME, lang, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.VERCEL === '1' || process.env.NODE_ENV === 'production'
    });
  }
  next();
}

module.exports = {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LOCALES,
  COOKIE_NAME,
  STRINGS,
  isLanguage,
  normalizeLanguage,
  resolveLanguage,
  translate,
  clientStrings,
  middleware
};
