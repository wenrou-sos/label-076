-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    dharma_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'receptionist', 'chanting_master')),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 寮房表
CREATE TABLE dormitories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number VARCHAR(20) NOT NULL,
    bed_number VARCHAR(20) NOT NULL,
    floor INTEGER NOT NULL,
    capacity INTEGER DEFAULT 1,
    current_occupant_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_number, bed_number)
);

-- 挂单登记表
CREATE TABLE guest_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dharma_name VARCHAR(100) NOT NULL,
    original_temple VARCHAR(200) NOT NULL,
    precepts_certificate_no VARCHAR(100) UNIQUE,
    arrival_date DATE NOT NULL,
    expected_stay_days INTEGER NOT NULL,
    actual_leave_date DATE,
    room_number VARCHAR(20),
    bed_number VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checked_out', 'probation', 'resident')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 常住僧人表
CREATE TABLE residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_registration_id UUID REFERENCES guest_registrations(id) UNIQUE,
    dharma_name VARCHAR(100) NOT NULL,
    generation_name VARCHAR(50) NOT NULL,
    tonsure_master VARCHAR(100) NOT NULL,
    precepts_date DATE NOT NULL,
    precepts_temple VARCHAR(200) NOT NULL,
    position VARCHAR(50),
    probation_start_date DATE NOT NULL,
    probation_end_date DATE,
    ordination_ceremony_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'probation' CHECK (status IN ('probation', 'active', 'suspended', 'left')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 考勤表
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monk_id UUID NOT NULL,
    monk_type VARCHAR(20) NOT NULL CHECK (monk_type IN ('guest', 'resident')),
    date DATE NOT NULL,
    session VARCHAR(10) NOT NULL CHECK (session IN ('morning', 'evening')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(monk_id, date, session)
);

-- 创建索引
CREATE INDEX idx_guest_registrations_status ON guest_registrations(status);
CREATE INDEX idx_guest_registrations_arrival_date ON guest_registrations(arrival_date);
CREATE INDEX idx_residents_status ON residents(status);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_monk ON attendance(monk_id, monk_type);
CREATE INDEX idx_dormitories_status ON dormitories(status);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表添加更新时间触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dormitories_updated_at BEFORE UPDATE ON dormitories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guest_registrations_updated_at BEFORE UPDATE ON guest_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON residents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入初始管理员用户 (密码: admin123456)
INSERT INTO users (username, dharma_name, role, password_hash) VALUES 
('admin', '系统管理员', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');

-- 插入示例寮房数据
INSERT INTO dormitories (room_number, bed_number, floor, capacity) VALUES 
('101', '1', 1, 1),
('101', '2', 1, 1),
('101', '3', 1, 1),
('102', '1', 1, 1),
('102', '2', 1, 1),
('201', '1', 2, 1),
('201', '2', 2, 1),
('202', '1', 2, 1),
('202', '2', 2, 1),
('301', '1', 3, 1),
('301', '2', 3, 1);

-- 插入示例挂单数据
INSERT INTO guest_registrations (dharma_name, original_temple, precepts_certificate_no, arrival_date, expected_stay_days, status, created_by)
SELECT '释妙明', '五台山普寿寺', 'JD2023001', CURRENT_DATE - INTERVAL '5 days', 15, 'active', id FROM users WHERE username = 'admin'
UNION ALL
SELECT '释真空', '少林寺', 'JD2023002', CURRENT_DATE - INTERVAL '2 days', 7, 'active', id FROM users WHERE username = 'admin'
UNION ALL
SELECT '释慧能', '南华寺', 'JD2023003', CURRENT_DATE - INTERVAL '1 month', 90, 'probation', id FROM users WHERE username = 'admin';

-- 插入示例常住数据
INSERT INTO residents (dharma_name, generation_name, tonsure_master, precepts_date, precepts_temple, position, probation_start_date, ordination_ceremony_date, status)
SELECT '释智慧', '智', '上普下能法师', CURRENT_DATE - INTERVAL '3 years', '宝华山隆昌寺', '知客', CURRENT_DATE - INTERVAL '2 years', CURRENT_DATE - INTERVAL '18 months', 'active'
UNION ALL
SELECT '释寂光', '寂', '上空下明法师', CURRENT_DATE - INTERVAL '5 years', '灵岩山寺', '维那', CURRENT_DATE - INTERVAL '3 years', CURRENT_DATE - INTERVAL '2.5 years', 'active'
UNION ALL
SELECT '释圆明', '圆', '上弘下愿法师', CURRENT_DATE - INTERVAL '2 years', '五台山碧山寺', '典座', CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE - INTERVAL '6 months', 'active'
UNION ALL
SELECT '释妙观', '妙', '上德下清法师', CURRENT_DATE - INTERVAL '1 year', '普陀山普济寺', NULL, CURRENT_DATE - INTERVAL '4 months', NULL, 'probation';
