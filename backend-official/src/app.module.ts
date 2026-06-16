import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UsersModule } from '@/modules/users/users.module';
import { WordsModule } from '@/modules/words/words.module';
import { TopicsModule } from '@/modules/topics/topics.module';
import { ExamplesModule } from '@/modules/examples/examples.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/auth/auth.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from '@/auth/passport/jwt-auth.guard';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { TransformInterceptor } from '@/core/transform.interceptor';
import { LearningModule } from '@/modules/learning/learning.module';
import { PartsOfSpeechModule } from '@/modules/parts-of-speech/parts-of-speech.module';
import { QuizModule } from '@/modules/quiz/quiz.module';
import { SpeakingModule } from '@/modules/speaking/speaking.module';
import { GeminiModule } from '@/modules/gemini/gemini.module';
import { StorageModule } from '@/modules/storage/storage.module';
import { EnglishWordsModule } from '@/modules/english-words/english-words.module';
import { VocabPracticeModule } from '@/modules/vocab-practice/vocab-practice.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    UsersModule,
    WordsModule,
    TopicsModule,
    ExamplesModule,
    AuthModule,
    LearningModule,
    PartsOfSpeechModule,
    QuizModule,
    SpeakingModule,
    GeminiModule,
    StorageModule,
    EnglishWordsModule,
    VocabPracticeModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        ssl: { rejectUnauthorized: false },
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: config.get<string>('MAIL_USER'),
            pass: config.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: { from: '"No Reply" <no-reply@localhost>' },
        template: {
          dir: process.cwd() + '/src/mail/templates/',
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
