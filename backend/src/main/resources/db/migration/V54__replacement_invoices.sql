-- FR-INV-06 retains canceled invoice history while allowing one active replacement per contract/period.
DROP INDEX uq_hoa_don_hop_dong_ky;
CREATE UNIQUE INDEX uq_hoa_don_hop_dong_ky ON HOA_DON(hop_dong_id, ky_id)
    WHERE trang_thai <> 'DA_HUY';
ALTER TABLE HOA_DON ADD COLUMN thay_the_hoa_don_id BIGINT NULL REFERENCES HOA_DON(id);
CREATE UNIQUE INDEX uq_hoa_don_thay_the ON HOA_DON(thay_the_hoa_don_id) WHERE thay_the_hoa_don_id IS NOT NULL;
