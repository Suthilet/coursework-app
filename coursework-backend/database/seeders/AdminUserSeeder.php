<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Создаем главного администратора
        if (!User::where('login', 'admin')->exists()) {
            User::create([
                'full_name' => 'Главный Администратор',
                'login' => 'admin',
                'password_hash' => Hash::make('Admin123!'), // Сложный пароль!
                'b_day' => '1990-01-01',
                'is_admin' => true,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $this->command->info('Администратор создан: admin / Admin123!');
        }

        // Создаем тестового пользователя
        if (!User::where('login', 'user')->exists()) {
            User::create([
                'full_name' => 'Тестовый Пользователь',
                'login' => 'user',
                'password_hash' => Hash::make('User123!'),
                'b_day' => '1995-05-15',
                'is_admin' => false,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $this->command->info('Пользователь создан: user / User123!');
        }
    }
}
