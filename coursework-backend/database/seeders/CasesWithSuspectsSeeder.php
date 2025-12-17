<?php

namespace Database\Seeders;

use App\Models\Cases;
use App\Models\Suspect;
use App\Models\Evidence;
use App\Models\User;
use App\Models\UserProgress;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CasesWithSuspectsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🚀 Запуск сидера для дел с подозреваемыми...');

        // Создаем тестовых пользователей если их нет
        $this->createTestUsers();

        // Очищаем старые данные (опционально)
        if ($this->command->confirm('Очистить старые данные дел, подозреваемых и доказательств?')) {
            Evidence::query()->delete();
            UserProgress::query()->delete();
            Suspect::query()->delete();
            Cases::query()->delete();
        }

        // Массив дел с данными
        $casesData = [
            [
                'title' => 'Убийство в библиотеке',
                'description' => 'Тело профессора археологии найдено в закрытой комнате университетской библиотеки. Комната была заперта изнутри, окна зарешечены. На столе - раскрытая древняя рукопись и чашка с остатками чая.',
                'difficulty' => 3,
                'suspects' => [
                    [
                        'name' => 'Анна Петрова',
                        'age' => 32,
                        'eyes' => 'зеленые',
                        'address' => 'ул. Пушкина, 15',
                        'phone' => '+7 (921) 123-45-67',
                        'hobby' => 'коллекционирование антиквариата',
                        'is_correct' => false,
                    ],
                    [
                        'name' => 'Дмитрий Соколов',
                        'age' => 45,
                        'eyes' => 'карие',
                        'address' => 'ул. Ленина, 28',
                        'phone' => '+7 (921) 234-56-78',
                        'hobby' => 'игра в шахматы',
                        'is_correct' => false,
                    ],
                    [
                        'name' => 'Елена Ковалева',
                        'age' => 29,
                        'eyes' => 'голубые',
                        'address' => 'ул. Гагарина, 7',
                        'phone' => '+7 (921) 345-67-89',
                        'hobby' => 'чтение детективов',
                        'is_correct' => true, // Правильный подозреваемый
                    ],
                    [
                        'name' => 'Игорь Морозов',
                        'age' => 51,
                        'eyes' => 'серые',
                        'address' => 'ул. Советская, 42',
                        'phone' => '+7 (921) 456-78-90',
                        'hobby' => 'садоводство',
                        'is_correct' => false,
                    ],
                    [
                        'name' => 'Мария Васнецова',
                        'age' => 38,
                        'eyes' => 'карие',
                        'address' => 'ул. Мира, 33',
                        'phone' => '+7 (921) 567-89-01',
                        'hobby' => 'фотография',
                        'is_correct' => false,
                    ],
                ],
                'evidences'=> []
            ],
            [
                'title' => 'Кража драгоценностей',
                'description' => 'Из сейфа в особняке миллионера пропала уникальная коллекция бриллиантов. Сейф был вскрыт профессионально, сигнализация отключена. На месте преступления не найдено следов взлома.',
                'difficulty' => 4,
                'suspects' => [
                    [
                        'name' => 'Александр Белов',
                        'age' => 41,
                        'eyes' => 'голубые',
                        'address' => 'ул. Садовая, 12',
                        'phone' => '+7 (921) 678-90-12',
                        'hobby' => 'альпинизм',
                        'is_correct' => false,
                    ],
                    [
                        'name' => 'Виктория Новикова',
                        'age' => 35,
                        'eyes' => 'зеленые',
                        'address' => 'ул. Цветочная, 8',
                        'phone' => '+7 (921) 789-01-23',
                        'hobby' => 'ювелирное дело',
                        'is_correct' => true, // Правильный подозреваемый
                    ],
                    [
                        'name' => 'Сергей Козлов',
                        'age' => 48,
                        'eyes' => 'карие',
                        'address' => 'ул. Лесная, 19',
                        'phone' => '+7 (921) 890-12-34',
                        'hobby' => 'электроника',
                        'is_correct' => false,
                    ],
                    [
                        'name' => 'Ольга Смирнова',
                        'age' => 42,
                        'eyes' => 'серые',
                        'address' => 'ул. Речная, 25',
                        'phone' => '+7 (921) 901-23-45',
                        'hobby' => 'рисование',
                        'is_correct' => false,
                    ],
                    [
                        'name' => 'Павел Иванов',
                        'age' => 39,
                        'eyes' => 'карие',
                        'address' => 'ул. Горная, 3',
                        'phone' => '+7 (921) 012-34-56',
                        'hobby' => 'карточные фокусы',
                        'is_correct' => false,
                    ],
                ],
                'evidences'=> []
            ],
            [
                'title' => 'Исчезновение артефакта',
                'description' => 'Из музея пропал древний артефакт - золотая статуэтка фараона. Витрина была разбита, но система охраны не сработала. Сотрудники утверждают, что слышали странные звуки ночью.',
                'difficulty' => 2,
                'suspects' => [
                    [
                        'name' => 'Николай Волков',
                        'age' => 55,
                        'eyes' => 'серые',
                        'address' => 'ул. Историческая, 17',
                        'phone' => '+7 (921) 123-45-89',
                        'hobby' => 'нумизматика',
                        'is_correct' => false,
                    ],
                    [
                        'name' => 'Татьяна Орлова',
                        'age' => 31,
                        'eyes' => 'голубые',
                        'address' => 'ул. Музейная, 6',
                        'phone' => '+7 (921) 234-56-90',
                        'hobby' => 'история Древнего Египта',
                        'is_correct' => false,
                    ],
                    [
                        'name' => 'Артем Федоров',
                        'age' => 44,
                        'eyes' => 'карие',
                        'address' => 'ул. Археологов, 21',
                        'phone' => '+7 (921) 345-67-01',
                        'hobby' => 'реставрация',
                        'is_correct' => false,
                    ],
                    [
                        'name' => 'Юлия Захарова',
                        'age' => 36,
                        'eyes' => 'зеленые',
                        'address' => 'ул. Ученых, 14',
                        'phone' => '+7 (921) 456-78-12',
                        'hobby' => 'каллиграфия',
                        'is_correct' => true, // Правильный подозреваемый
                    ],
                    [
                        'name' => 'Максим Попов',
                        'age' => 49,
                        'eyes' => 'карие',
                        'address' => 'ул. Коллекционеров, 9',
                        'phone' => '+7 (921) 567-89-23',
                        'hobby' => 'антиквариат',
                        'is_correct' => false,
                    ],
                ],
                'evidences'=> []
            ],
        ];

        $createdCases = [];
        $createdSuspects = [];

        foreach ($casesData as $caseData) {
            // Создаем дело
            $case = Cases::create([
                'title' => $caseData['title'],
                'description' => $caseData['description'],
                'difficulty' => $caseData['difficulty'],
                // suspect_id установим позже, после создания подозреваемых
            ]);

            $createdCases[] = $case;

            // Создаем подозреваемых для этого дела
            $correctSuspectId = null;
            foreach ($caseData['suspects'] as $suspectData) {
                $suspect = Suspect::create([
                    'name' => $suspectData['name'],
                    'age' => $suspectData['age'],
                    'eyes' => $suspectData['eyes'],
                    'address' => $suspectData['address'],
                    'phone' => $suspectData['phone'],
                    'hobby' => $suspectData['hobby'],
                    'case_id' => $case->id,
                ]);

                $createdSuspects[] = $suspect;

                // Запоминаем ID правильного подозреваемого
                if ($suspectData['is_correct']) {
                    $correctSuspectId = $suspect->id;
                }
            }

            // Обновляем дело с ID правильного подозреваемого
            if ($correctSuspectId) {
                $case->update(['suspect_id' => $correctSuspectId]);
            }

            // Создаем доказательства
            foreach ($caseData['evidences'] as $evidenceData) {
                Evidence::create([
                    'case_id' => $case->id,
                    'title' => $evidenceData['title'],
                    'description' => $evidenceData['description'],
                    'type' => $evidenceData['type'],
                ]);
            }

            $this->command->info("✅ Дело создано: {$case->title} (ID: {$case->id})");
            $this->command->info("   Подозреваемых: " . count($caseData['suspects']));
            $this->command->info("   Доказательств: " . count($caseData['evidences']));
            $this->command->info("   Правильный ответ: ID {$correctSuspectId}");
        }

        // Создаем тестовый прогресс для пользователей
        $this->createTestProgress($createdCases);

        $this->command->info('🎉 Сидер успешно выполнен!');
        $this->command->info('📊 Итоговая статистика:');
        $this->command->info("   - Дел создано: " . count($createdCases));
        $this->command->info("   - Подозреваемых создано: " . count($createdSuspects));
        $this->command->info("   - Всего доказательств: " . Evidence::count());
        $this->command->info("   - Всего записей прогресса: " . UserProgress::count());
    }

    /**
     * Создание тестовых пользователей
     */
    private function createTestUsers(): void
    {
        // Проверяем существование тестового пользователя
        if (!User::where('login', 'testuser')->exists()) {
            User::create([
                'full_name' => 'Тестовый Пользователь',
                'login' => 'testuser',
                'password_hash' => Hash::make('test123'),
                'b_day' => '1995-05-15',
                'is_admin' => false,
            ]);
            $this->command->info('✅ Тестовый пользователь создан: testuser / test123');
        }

        // Проверяем существование администратора
        if (!User::where('login', 'admin')->exists()) {
            User::create([
                'full_name' => 'Администратор',
                'login' => 'admin',
                'password_hash' => Hash::make('admin123'),
                'b_day' => '1990-01-01',
                'is_admin' => true,
            ]);
            $this->command->info('✅ Администратор создан: admin / admin123');
        }

        // Создаем еще несколько тестовых пользователей
        $users = [
            ['login' => 'player1', 'full_name' => 'Игрок Один', 'b_day' => '1992-03-10'],
            ['login' => 'player2', 'full_name' => 'Игрок Два', 'b_day' => '1993-07-22'],
            ['login' => 'detective', 'full_name' => 'Детектив Профи', 'b_day' => '1988-11-30'],
        ];

        foreach ($users as $userData) {
            if (!User::where('login', $userData['login'])->exists()) {
                User::create([
                    'full_name' => $userData['full_name'],
                    'login' => $userData['login'],
                    'password_hash' => Hash::make('password123'),
                    'b_day' => $userData['b_day'],
                    'is_admin' => false,
                ]);
                $this->command->info("✅ Пользователь создан: {$userData['login']} / password123");
            }
        }
    }

    /**
     * Создание тестового прогресса
     */
    private function createTestProgress(array $cases): void
    {
        $users = User::where('is_admin', false)->limit(3)->get();

        if ($users->isEmpty()) {
            $this->command->warn('⚠️  Нет пользователей для создания прогресса');
            return;
        }

        $statuses = ['started', 'in_progress', 'completed', 'failed'];
        $progressCount = 0;

        foreach ($users as $user) {
            // Для каждого пользователя создаем прогресс по нескольким делам
            foreach ($cases as $index => $case) {
                $status = $statuses[$index % count($statuses)];
                $score = $status === 'completed' ? rand(60, 100) : 0;

                UserProgress::create([
                    'user_id' => $user->id,
                    'case_id' => $case->id,
                    'status' => $status,
                    'score' => $score,
                ]);

                $progressCount++;
            }

            $this->command->info("📝 Прогресс создан для пользователя: {$user->login}");
        }

        $this->command->info("✅ Создано записей прогресса: {$progressCount}");
    }
}
