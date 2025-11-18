#!/usr/bin/env python3

import sqlite3
import os

def check_database():
    """Check database schema and fix any issues"""
    try:
        # Check if database exists
        db_path = 'agridrone.db'
        if not os.path.exists(db_path):
            print("❌ Database does not exist")
            return False
            
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"📊 Tables found: {tables}")
        
        # Check analysis_records schema
        if 'analysis_records' in tables:
            cursor.execute("PRAGMA table_info(analysis_records);")
            columns = cursor.fetchall()
            print("📋 analysis_records columns:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
                
            # Check if result_image_path column exists
            column_names = [col[1] for col in columns]
            if 'result_image_path' not in column_names:
                print("⚠️  Missing result_image_path column, adding it...")
                cursor.execute("ALTER TABLE analysis_records ADD COLUMN result_image_path TEXT;")
                conn.commit()
                print("✅ Added result_image_path column")
        
        # Check users table
        if 'users' in tables:
            cursor.execute("SELECT COUNT(*) FROM users;")
            user_count = cursor.fetchone()[0]
            print(f"👥 Users in database: {user_count}")
        
        conn.close()
        print("✅ Database check completed successfully")
        return True
        
    except Exception as e:
        print(f"❌ Database check failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    check_database()
