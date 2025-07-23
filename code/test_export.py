from app import app
from backend.tasks import export_quiz_data_csv

def test_export():
    """Test the CSV export functionality"""
    with app.app_context():
        print("Testing CSV export...")
        result = export_quiz_data_csv()
        print(f"Export result: {result}")

if __name__ == "__main__":
    test_export()