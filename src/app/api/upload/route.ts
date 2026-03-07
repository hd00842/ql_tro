import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { message: 'Không có file được chọn' },
        { status: 400 }
      );
    }

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { message: 'Chỉ được upload file ảnh' },
        { status: 400 }
      );
    }

    // Kiểm tra kích thước file (tối đa 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: 'Kích thước file không được vượt quá 10MB' },
        { status: 400 }
      );
    }

    // Tạo thư mục uploads nếu chưa có
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Tạo tên file duy nhất
    const ext = extname(file.name) || '.jpg';
    const uniqueName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
    const filePath = join(UPLOAD_DIR, uniqueName);

    // Lưu file vào local
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const publicId = `uploads/${uniqueName}`;
    const secureUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      data: {
        public_id: publicId,
        secure_url: secureUrl,
        width: 0,
        height: 0,
      },
      message: 'Upload ảnh thành công',
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra khi upload file' },
      { status: 500 }
    );
  }
}
