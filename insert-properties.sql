-- Insert properties data from backend
-- Connect to Neon database first, then run this script

INSERT INTO properties (id, title, description, price, type, status, location, city, state, ownerid) VALUES
('550e8400-e29b-41d4-a716-446655440015', 'Cozy Studio in Surulere', 'Perfect starter home in a vibrant neighborhood with modern amenities.', 250000.00, 'apartment', 'for-sale', '{"address":"123 Surulere Street","city":"Lagos","state":"Lagos"}', 'Lagos', 'Lagos', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440014', 'Luxury Penthouse in Victoria Island', 'Stunning penthouse with panoramic city views and premium finishes.', 1500000.00, 'apartment', 'for-sale', '{"address":"45 Victoria Island","city":"Lagos","state":"Lagos"}', 'Lagos', 'Lagos', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440010', 'Medical Professional Apartment', 'Ideal for medical professionals near major hospitals.', 450000.00, 'apartment', 'for-rent', '{"address":"78 Medical Center Road","city":"Lagos","state":"Lagos"}', 'Lagos', 'Lagos', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440013', 'Architectural Masterpiece in Gbagada', 'Unique architectural design with modern amenities.', 850000.00, 'house', 'for-sale', '{"address":"15 Gbagada Avenue","city":"Lagos","state":"Lagos"}', 'Lagos', 'Lagos', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440012', 'Modern Townhouse in Lekki', 'Contemporary townhouse in prime Lekki location.', 1200000.00, 'townhouse', 'for-sale', '{"address":"89 Lekki Phase 1","city":"Lagos","state":"Lagos"}', 'Lagos', 'Lagos', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440011', 'Luxury Apartment in Ikoyi', 'High-end apartment with premium amenities.', 2000000.00, 'apartment', 'for-sale', '{"address":"200 Ikoyi Road","city":"Lagos","state":"Lagos"}', 'Lagos', 'Lagos', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-44665544000c', 'Commercial Retail Space in Victoria Island', 'Prime commercial space in high-traffic area.', 3000000.00, 'commercial', 'for-sale', '{"address":"55 Commercial Avenue","city":"Lagos","state":"Lagos"}', 'Lagos', 'Lagos', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-44665544000d', 'Family Home in Gbagada', 'Spacious family home in quiet neighborhood.', 750000.00, 'house', 'for-sale', '{"address":"25 Family Street","city":"Lagos","state":"Lagos"}', 'Lagos', 'Lagos', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-44665544000e', 'Modern Studio in Port Harcourt', 'Modern studio perfect for young professionals.', 180000.00, 'apartment', 'for-rent', '{"address":"100 Port Harcourt Road","city":"Port Harcourt","state":"Rivers"}', 'Port Harcourt', 'Rivers', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-44665544000f', 'Executive Villa in Port Harcourt', 'Luxury villa with private pool and garden.', 2500000.00, 'house', 'for-sale', '{"address":"500 Executive Drive","city":"Port Harcourt","state":"Rivers"}', 'Port Harcourt', 'Rivers', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-44665544000b', 'Luxury Apartment in Banana Island', 'Exclusive apartment in prestigious Banana Island.', 3500000.00, 'apartment', 'for-sale', '{"address":"1 Banana Island","city":"Lagos","state":"Lagos"}', 'Lagos', 'Lagos', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-44665544000a', 'Executive Duplex in Magodo', 'Executive duplex with modern amenities.', 1800000.00, 'house', 'for-sale', '{"address":"75 Magodo Estate","city":"Lagos","state":"Lagos"}', 'Lagos', 'Lagos', '550e8400-e29b-41d4-a716-446655440001');

-- Verify insertion
SELECT COUNT(*) as total_properties FROM properties;
SELECT title, city, price FROM properties LIMIT 5;
