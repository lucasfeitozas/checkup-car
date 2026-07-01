CREATE TABLE `modelos_carro` (
	`id` text PRIMARY KEY NOT NULL,
	`marca` text NOT NULL,
	`modelo` text NOT NULL,
	`ano_inicio` integer NOT NULL,
	`ano_fim` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `modelos_carro_marca_modelo_ano_inicio_unique` ON `modelos_carro` (`marca`,`modelo`,`ano_inicio`);--> statement-breakpoint
CREATE TABLE `tipos_evento` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`intervalo_km` integer,
	`intervalo_meses` integer,
	`origem` text DEFAULT 'sistema' NOT NULL,
	CONSTRAINT "tipos_evento_origem_check" CHECK("tipos_evento"."origem" IN ('sistema', 'usuario'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tipos_evento_nome_origem_unique` ON `tipos_evento` (`nome`,`origem`);--> statement-breakpoint
CREATE TABLE `historico_execucao` (
	`id` text PRIMARY KEY NOT NULL,
	`evento_carro_id` text NOT NULL,
	`km_execucao` integer NOT NULL,
	`data_execucao` text NOT NULL,
	`valor` real,
	`local` text,
	FOREIGN KEY (`evento_carro_id`) REFERENCES `eventos_carro`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `historico_execucao_evento_carro_id_idx` ON `historico_execucao` (`evento_carro_id`);--> statement-breakpoint
CREATE INDEX `historico_execucao_evento_carro_id_data_execucao_idx` ON `historico_execucao` (`evento_carro_id`,`data_execucao`);--> statement-breakpoint
CREATE TABLE `registros_km` (
	`id` text PRIMARY KEY NOT NULL,
	`carro_id` text NOT NULL,
	`km` integer NOT NULL,
	`data_registro` text NOT NULL,
	FOREIGN KEY (`carro_id`) REFERENCES `carros`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `registros_km_carro_id_idx` ON `registros_km` (`carro_id`);--> statement-breakpoint
CREATE INDEX `registros_km_carro_id_data_registro_idx` ON `registros_km` (`carro_id`,`data_registro`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`senha_hash` text,
	`google_id` text,
	`foto_url` text,
	`criado_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);--> statement-breakpoint
CREATE TABLE `eventos_carro` (
	`id` text PRIMARY KEY NOT NULL,
	`carro_id` text NOT NULL,
	`tipo_evento_id` text NOT NULL,
	`ultima_km_execucao` integer,
	`ultima_data_execucao` text,
	`proxima_km` integer,
	`proxima_data` text,
	FOREIGN KEY (`carro_id`) REFERENCES `carros`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tipo_evento_id`) REFERENCES `tipos_evento`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `eventos_carro_carro_id_idx` ON `eventos_carro` (`carro_id`);--> statement-breakpoint
CREATE INDEX `eventos_carro_tipo_evento_id_idx` ON `eventos_carro` (`tipo_evento_id`);--> statement-breakpoint
CREATE TABLE `carros` (
	`id` text PRIMARY KEY NOT NULL,
	`usuario_id` text NOT NULL,
	`modelo_id` text,
	`placa` text NOT NULL,
	`nome_apelido` text NOT NULL,
	`ano` integer NOT NULL,
	`km_atual` integer DEFAULT 0 NOT NULL,
	`criado_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modelo_id`) REFERENCES `modelos_carro`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `carros_usuario_id_idx` ON `carros` (`usuario_id`);--> statement-breakpoint
CREATE INDEX `carros_modelo_id_idx` ON `carros` (`modelo_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `carros_usuario_id_placa_unique` ON `carros` (`usuario_id`,`placa`);